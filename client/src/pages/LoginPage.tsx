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
