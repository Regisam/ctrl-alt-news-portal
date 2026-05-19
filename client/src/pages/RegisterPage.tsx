import { useState } from 'react';
import { useLocation } from 'wouter';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage({ lang }: { lang: 'en' | 'pt' }) {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [, setLocation] = useLocation();

  const translations = {
    en: {
      title: 'Create Account',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      register: 'Register',
      loginLink: 'Already have an account? Log in',
      loading: 'Creating account...',
      success: 'Account created! Redirecting...',
    },
    pt: {
      title: 'Criar Conta',
      email: 'Email',
      password: 'Senha',
      confirmPassword: 'Confirmar Senha',
      register: 'Registrar',
      loginLink: 'Já tem uma conta? Faça login',
      loading: 'Criando conta...',
      success: 'Conta criada! Redirecionando...',
    },
  };

  const t = translations[lang];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = lang === 'en' ? 'Email is required' : 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = lang === 'en' ? 'Invalid email format' : 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = lang === 'en' ? 'Password is required' : 'Senha é obrigatória';
    } else if (formData.password.length < 8) {
      newErrors.password = lang === 'en' ? 'Password must be at least 8 characters' : 'Senha deve ter no mínimo 8 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = lang === 'en' ? 'Confirm password is required' : 'Confirmar senha é obrigatório';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = lang === 'en' ? 'Passwords do not match' : 'Senhas não coincidem';
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        }
        setSubmitError(
          data.error ||
            (lang === 'en' ? 'Registration failed. Please try again.' : 'Falha no registro. Tente novamente.'),
        );
        setLoading(false);
        return;
      }

      // Success - redirect to login
      setTimeout(() => {
        setLocation('/login');
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
                placeholder={lang === 'en' ? 'Min. 8 characters' : 'Mín. 8 caracteres'}
                disabled={loading}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                {t.confirmPassword}
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded border transition-colors ${
                  errors.confirmPassword
                    ? 'border-red-500 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500'
                    : 'border-color-border-subtle bg-secondary focus:outline-none focus:ring-2 focus:ring-primary'
                }`}
                placeholder={lang === 'en' ? 'Confirm password' : 'Confirmar senha'}
                disabled={loading}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded font-semibold transition-all bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t.loading : t.register}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <a href="/login" className="text-sm text-primary hover:underline">
              {t.loginLink}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
