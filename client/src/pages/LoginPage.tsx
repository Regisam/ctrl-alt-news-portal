import { useState } from 'react';
import { useLocation } from 'wouter';

interface LoginFormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage({ lang }: { lang: 'en' | 'pt' }) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [, setLocation] = useLocation();

  const translations = {
    en: {
      title: 'Sign In',
      email: 'Email',
      password: 'Password',
      login: 'Sign In',
      registerLink: "Don't have an account? Sign up",
      loading: 'Signing in...',
      success: 'Login successful! Redirecting...',
      emailRequired: 'Email is required',
      emailInvalid: 'Invalid email format',
      passwordRequired: 'Password is required',
    },
    pt: {
      title: 'Entrar',
      email: 'Email',
      password: 'Senha',
      login: 'Entrar',
      registerLink: 'Não tem uma conta? Inscreva-se',
      loading: 'Entrando...',
      success: 'Login realizado! Redirecionando...',
      emailRequired: 'Email é obrigatório',
      emailInvalid: 'Email inválido',
      passwordRequired: 'Senha é obrigatória',
    },
  };

  const t = translations[lang];

  const handleGoogleOAuth = async () => {
    try {
      const response = await fetch('/api/auth/oauth/google');
      const data = await response.json();
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (_error) {
      setSubmitError(
        lang === 'en'
          ? 'Failed to initiate Google sign-in'
          : 'Falha ao iniciar login com Google'
      );
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = lang === 'en' ? t.emailRequired : t.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = lang === 'en' ? t.emailInvalid : t.emailInvalid;
    }

    if (!formData.password) {
      newErrors.password = lang === 'en' ? t.passwordRequired : t.passwordRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        }
        setSubmitError(
          data.error ||
            (lang === 'en' ? 'Login failed. Please try again.' : 'Falha no login. Tente novamente.'),
        );
        setLoading(false);
        return;
      }

      // Store access token
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }

      // Success - redirect to profile
      setTimeout(() => {
        setLocation('/profile/me');
      }, 1000);
    } catch (_error) {
      setSubmitError(
        lang === 'en'
          ? 'An error occurred. Please try again.'
          : 'Ocorreu um erro. Tente novamente.',
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-lg p-8 border border-color-border-subtle">
          <h1 className="text-3xl font-bold mb-8 text-foreground">{t.title}</h1>

          {submitError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                {t.email}
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded border transition-colors ${
                  errors.email
                    ? 'border-red-500 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500'
                    : 'border-color-border-subtle bg-secondary focus:outline-none focus:ring-2 focus:ring-primary'
                }`}
                placeholder={lang === 'en' ? 'you@example.com' : 'seu@email.com'}
                disabled={loading}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                {t.password}
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded border transition-colors ${
                  errors.password
                    ? 'border-red-500 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500'
                    : 'border-color-border-subtle bg-secondary focus:outline-none focus:ring-2 focus:ring-primary'
                }`}
                placeholder={lang === 'en' ? 'Enter password' : 'Digite sua senha'}
                disabled={loading}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded font-semibold transition-all bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t.loading : t.login}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-color-border-subtle" />
            <span className="text-xs text-secondary-foreground">
              {lang === 'en' ? 'OR' : 'OU'}
            </span>
            <div className="flex-1 h-px bg-color-border-subtle" />
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleOAuth}
            disabled={loading}
            className="w-full mt-4 px-4 py-3 rounded font-semibold transition-all bg-white text-black border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {lang === 'en' ? 'Sign in with Google' : 'Entrar com Google'}
          </button>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <a href="/register" className="text-sm text-primary hover:underline">
              {t.registerLink}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
