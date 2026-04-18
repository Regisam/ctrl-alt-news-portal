import type { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import logger from '../logger';

interface ContactRequest {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

interface ValidationErrors {
  [key: string]: string;
}

// Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContact(data: ContactRequest): ValidationErrors {
  const errors: ValidationErrors = {};

  // Validate name
  if (!data.name) {
    errors.name = 'Name is required';
  } else if (typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (data.name.length > 255) {
    errors.name = 'Name must not exceed 255 characters';
  }

  // Validate email
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(data.email.toLowerCase().trim())) {
    errors.email = 'Invalid email address';
  } else if (data.email.length > 255) {
    errors.email = 'Email must not exceed 255 characters';
  }

  // Validate subject
  if (!data.subject) {
    errors.subject = 'Subject is required';
  } else if (typeof data.subject !== 'string' || data.subject.trim().length < 5) {
    errors.subject = 'Subject must be at least 5 characters';
  } else if (data.subject.length > 500) {
    errors.subject = 'Subject must not exceed 500 characters';
  }

  // Validate message
  if (!data.message) {
    errors.message = 'Message is required';
  } else if (typeof data.message !== 'string' || data.message.trim().length < 20) {
    errors.message = 'Message must be at least 20 characters';
  } else if (data.message.length > 5000) {
    errors.message = 'Message must not exceed 5000 characters';
  }

  return errors;
}

export function setupContactRoute(router: Router): void {
  router.post(
    '/api/contact',
    async (req: Request<object, object, ContactRequest>, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Log incoming request
        logger.info('POST /api/contact received', {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });

        // Validate input
        const errors = validateContact(req.body);
        if (Object.keys(errors).length > 0) {
          logger.warn('Contact form validation failed', { errors, email: req.body.email });
          res.status(400).json({
            success: false,
            errors,
          });
          return;
        }

        // Extract and sanitize data
        const { name, email, subject, message } = req.body;
        const sanitizedData = {
          name: String(name).trim(),
          email: String(email).toLowerCase().trim(),
          subject: String(subject).trim(),
          message: String(message).trim(),
        };

        // Create contact submission in database
        const submission = await prisma.contactSubmission.create({
          data: {
            name: sanitizedData.name,
            email: sanitizedData.email,
            subject: sanitizedData.subject,
            message: sanitizedData.message,
            status: 'NEW',
          },
        });

        // Log successful submission
        logger.info('Contact submission created', {
          submissionId: submission.id,
          email: sanitizedData.email,
        });

        // Return success response
        res.status(201).json({
          success: true,
          id: submission.id,
          message: 'Thank you for reaching out. Our team will get back to you within two business days.',
        });
      } catch (error) {
        logger.error('Error processing contact form', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        next(error);
      }
    }
  );
}
