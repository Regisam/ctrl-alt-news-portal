/**
 * Smart Digest Service — Story 12.7
 *
 * Handles digest generation, email rendering, scheduling, and delivery
 */

import { SmartDigestPayload, DigestArticle } from '../../client/src/lib/smart-digest.types';

/**
 * Renders HTML email from digest payload
 *
 * @param digest - The digest payload with articles and config
 * @param userName - User's display name
 * @param baseUrl - Base URL for links (e.g., https://ctrl-alt-news.local)
 * @returns Rendered HTML email string
 *
 * AC3: Email template with 3-5 articles
 * AC5: Each article includes title, summary, link, category
 * AC6: Unsubscribe link in footer
 * AC7: Preference management link
 */
export function renderDigestEmail(
  digest: SmartDigestPayload,
  userName: string,
  baseUrl: string = 'https://ctrl-alt-news.local'
): string {
  // Build article HTML dynamically
  const articlesHtml = digest.articles
    .map((article) => renderArticleBlock(article, baseUrl))
    .join('');

  // Build unsubscribe and preferences links (include tokens for one-time validation)
  const unsubscribeLink = `${baseUrl}/api/digest/unsubscribe/${digest.unsubscribeToken}`;
  const preferencesLink = `${baseUrl}/digest/preferences/${digest.preferencesToken}`;

  // Tracking pixel for open rate (AC8: email analytics)
  const trackingPixel = `${baseUrl}/api/digest/open/${digest.unsubscribeToken}`;

  // Escape user name for security (AC12: XSS prevention)
  const escapedUserName = escapeHtml(userName);

  // Determine frequency label for greeting
  const frequencyLabel = digest.config.frequency === 'daily' ? 'day' : 'week';

  // Template literal email (responsive HTML + inline CSS)
  const htmlEmail = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Smart Digest</title>
  <style>
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #1a1a1a;
        color: #e0e0e0;
      }

      .container {
        background-color: #2a2a2a;
        color: #e0e0e0;
      }

      .article {
        border-color: #444;
      }

      .summary {
        color: #b0b0b0;
      }

      .reason {
        color: #888;
      }

      .footer-text {
        color: #888;
      }

      a {
        color: #66b3ff;
      }
    }

    /* Container */
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }

    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .header p {
      font-size: 14px;
      opacity: 0.9;
    }

    /* Main content */
    .content {
      padding: 32px 24px;
    }

    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      line-height: 1.6;
    }

    .intro {
      font-size: 14px;
      color: #666;
      margin-bottom: 32px;
      line-height: 1.6;
    }

    @media (prefers-color-scheme: dark) {
      .intro {
        color: #aaa;
      }
    }

    /* Articles section */
    .articles {
      margin-bottom: 32px;
    }

    .article {
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .article h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 12px;
      line-height: 1.4;
    }

    .article h3 a {
      color: #0066cc;
      text-decoration: none;
    }

    .article h3 a:hover {
      text-decoration: underline;
    }

    .article-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .category {
      display: inline-block;
      background-color: #f0f0f0;
      color: #333;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Category badge colors */
    .category.ai {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .category.science {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .category.robotics {
      background-color: #e0f2f1;
      color: #00796b;
    }

    .category.gadgets {
      background-color: #fff3e0;
      color: #e65100;
    }

    .summary {
      font-size: 14px;
      color: #666;
      margin-bottom: 12px;
      line-height: 1.5;
    }

    .reason {
      font-size: 13px;
      color: #999;
      font-style: italic;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
    }

    .reason::before {
      content: '✓ ';
      color: #667eea;
      font-weight: 600;
      font-style: normal;
    }

    /* Footer */
    .footer {
      background-color: #f8f8f8;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }

    .footer-links {
      margin-bottom: 16px;
    }

    .footer-links a {
      color: #0066cc;
      text-decoration: none;
      font-size: 13px;
      margin: 0 8px;
    }

    .footer-links a:hover {
      text-decoration: underline;
    }

    .footer-text {
      font-size: 12px;
      color: #999;
      line-height: 1.6;
    }

    /* Tracking pixel */
    .tracking-pixel {
      width: 1px;
      height: 1px;
      display: block;
    }

    /* Mobile responsive */
    @media (max-width: 600px) {
      .container {
        border-radius: 0;
      }

      .header {
        padding: 24px 16px;
      }

      .header h1 {
        font-size: 24px;
      }

      .content {
        padding: 20px 16px;
      }

      .article {
        padding: 16px;
        margin-bottom: 12px;
      }

      .article h3 {
        font-size: 16px;
      }

      .article-meta {
        flex-direction: column;
        align-items: flex-start;
      }

      .footer {
        padding: 16px;
      }

      .footer-links a {
        display: block;
        margin: 8px 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>Your Smart Digest</h1>
      <p>Top articles curated for you</p>
    </div>

    <!-- Main Content -->
    <div class="content">
      <p class="greeting">Hi ${escapedUserName},</p>

      <p class="intro">
        Here are the top articles matching your interests this ${frequencyLabel}.
        Each article is ranked by relevance to your favorite topics.
      </p>

      <!-- Articles -->
      <div class="articles">
        ${articlesHtml}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-links">
        <a href="${preferencesLink}">Manage Preferences</a> |
        <a href="${unsubscribeLink}">Unsubscribe</a>
      </div>
      <p class="footer-text">
        You're receiving this email because you enabled Smart Digest in your preferences.<br>
        Questions? <a href="${baseUrl}">Visit our website</a>
      </p>
      <!-- Tracking pixel for open rate -->
      <img src="${trackingPixel}" alt="" width="1" height="1" class="tracking-pixel">
    </div>
  </div>
</body>
</html>`;

  return htmlEmail;
}

/**
 * Renders a single article block for the digest email
 *
 * @param article - The article data
 * @param baseUrl - Base URL for article links
 * @returns HTML string for the article
 */
function renderArticleBlock(article: DigestArticle, baseUrl: string): string {
  // Add UTM tracking to article link for click tracking
  const articleLink = `${article.link}?utm_source=digest&utm_medium=email&utm_campaign=smart_digest`;

  // Sanitize category name for CSS class (lowercase, no spaces)
  const categoryClass = String(article.category)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');

  // Truncate summary to reasonable length if needed
  const displaySummary = article.summary.length > 150
    ? `${article.summary.substring(0, 150)}...`
    : article.summary;

  return `
    <div class="article">
      <h3><a href="${articleLink}">${escapeHtml(article.title)}</a></h3>
      <div class="article-meta">
        <span class="category ${categoryClass}">${escapeHtml(article.category)}</span>
      </div>
      <p class="summary">${escapeHtml(displaySummary)}</p>
      <p class="reason">Recommended because: ${escapeHtml(article.reason)}</p>
    </div>
  `;
}

/**
 * Escapes HTML special characters to prevent XSS
 *
 * AC12: Security - no XSS vulnerabilities
 *
 * @param text - Text to escape
 * @returns Escaped text safe for HTML
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Generates a one-time security token for unsubscribe/preferences links
 *
 * AC6: One-time tokens for unsubscribe
 * AC12: Token-based security
 *
 * @param tokenType - Type of token (unsubscribe, preferences)
 * @returns 32-character random alphanumeric token
 */
export function generateOneTimeToken(tokenType: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
