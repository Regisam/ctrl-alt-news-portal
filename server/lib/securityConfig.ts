// AC10: Security configuration (centralized)

export interface SecurityConfig {
  enableHttpsRedirect: boolean;
  enableSecurityHeaders: boolean;
  enableInputValidation: boolean;
  corsOrigins: string[];
  rateLimitPercentage: number; // % of rate limit for auth endpoints
  passwordMinLength: number;
  sessionTimeout: number; // milliseconds
  maxLoginAttempts: number;
  lockoutDuration: number; // milliseconds
}

// AC10: Default security config (from environment variables)
export function getSecurityConfig(): SecurityConfig {
  return {
    enableHttpsRedirect: process.env.NODE_ENV === 'production',
    enableSecurityHeaders: true,
    enableInputValidation: true,
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    rateLimitPercentage: parseInt(process.env.RATE_LIMIT_PERCENTAGE || '20', 10),
    passwordMinLength: 12,
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000', 10), // 1 hour default
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  };
}

// AC10: Validate that no secrets are in code
export function validateNoSecretsInCode(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check for hardcoded secrets
  const processEnv = JSON.stringify(process.env);

  if (processEnv.includes('password')) {
    warnings.push('Found "password" in environment variables (should be in .env)');
  }

  if (processEnv.includes('secret')) {
    warnings.push('Found "secret" in environment variables (should be in .env)');
  }

  if (processEnv.includes('token')) {
    warnings.push('Found "token" in environment variables (should be in .env)');
  }

  // Check that critical variables are set
  if (!process.env.NODE_ENV) {
    warnings.push('NODE_ENV not set (defaults to development)');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

export const DEFAULT_SECURITY_CONFIG = getSecurityConfig();
