import crypto from 'crypto';

// AC4: Stack trace normalization (ignore changing line numbers)
export function normalizeStackTrace(stack: string): string {
  if (!stack) return '';

  return stack
    .split('\n')
    .map((line) => {
      // Remove line/column numbers: file.ts:123:45 → file.ts
      return line.replace(/:\d+:\d+/g, '');
    })
    .join('\n');
}

// AC5: Severity classification based on error type
export function classifyErrorSeverity(errorType: string, message: string): 'critical' | 'high' | 'medium' | 'low' {
  const lowerMessage = message.toLowerCase();

  // Critical errors
  if (
    errorType === 'OutOfMemoryError' ||
    errorType === 'StackOverflowError' ||
    lowerMessage.includes('fatal') ||
    lowerMessage.includes('crash')
  ) {
    return 'critical';
  }

  // High severity
  if (
    errorType === 'TypeError' ||
    errorType === 'ReferenceError' ||
    lowerMessage.includes('failed to') ||
    lowerMessage.includes('unable to')
  ) {
    return 'high';
  }

  // Medium severity
  if (
    errorType === 'ValidationError' ||
    errorType === 'TimeoutError' ||
    lowerMessage.includes('warning') ||
    lowerMessage.includes('deprecated')
  ) {
    return 'medium';
  }

  // Low severity (default)
  return 'low';
}

interface ErrorInfo {
  type: string;
  message: string;
  stack?: string;
}

// Create stable fingerprint for error grouping
export function createErrorFingerprint(error: ErrorInfo): string {
  // Normalize stack trace
  const normalizedStack = error.stack ? normalizeStackTrace(error.stack) : '';

  // Create fingerprint from type + message + normalized stack
  const fingerprintData = `${error.type}|${error.message}|${normalizedStack}`;

  // Hash to create stable fingerprint
  return crypto.createHash('sha256').update(fingerprintData).digest('hex').substring(0, 12);
}

// Extract first few stack frames for grouping
export function getErrorSignature(error: ErrorInfo): string {
  if (!error.stack) {
    return `${error.type}: ${error.message}`;
  }

  const lines = error.stack.split('\n');
  const firstFrame = lines
    .slice(0, 3)
    .map((line) => line.trim().replace(/:\d+:\d+/g, ''))
    .join(' → ');

  return `${error.type}: ${error.message}\n${firstFrame}`;
}
