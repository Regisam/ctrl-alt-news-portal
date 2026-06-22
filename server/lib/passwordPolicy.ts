// AC8: Password policy enforcement

export interface PasswordValidationResult {
  valid: boolean;
  score: number; // 0-100
  errors: string[];
  suggestions: string[];
}

// AC8: Validate password against policy
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Minimum length: 12 characters
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  } else {
    score += 25;
  }

  // Maximum length: 128 characters
  if (password.length > 128) {
    errors.push('Password must be at most 128 characters long');
  }

  // Contains uppercase letters
  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    suggestions.push('Include uppercase letters for better security');
  }

  // Contains lowercase letters
  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    suggestions.push('Include lowercase letters for better security');
  }

  // Contains numbers
  if (/\d/.test(password)) {
    score += 15;
  } else {
    suggestions.push('Include numbers for better security');
  }

  // Contains special characters
  if (/[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(password)) {
    score += 15;
  } else {
    suggestions.push('Include special characters (!@#$%) for better security');
  }

  // Reject common patterns
  const commonPatterns = [
    'password',
    '123456',
    'qwerty',
    'abc123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
  ];

  if (commonPatterns.some((pattern) => password.toLowerCase().includes(pattern))) {
    errors.push('Password contains common patterns that are easy to guess');
  }

  // No username in password
  // (This would require checking against the username, so skip for now)

  return {
    valid: errors.length === 0,
    score: Math.min(100, Math.max(0, score)),
    errors,
    suggestions,
  };
}

// AC8: Check password strength
export function isPasswordStrong(password: string): boolean {
  const result = validatePassword(password);
  // Require: min 12 chars + complexity
  return (
    result.valid &&
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(password)
  );
}

// Password policy requirements
export const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  expiryDays: 90, // Optional: force password change every 90 days
  historyCount: 3, // Optional: prevent reusing last 3 passwords
};
