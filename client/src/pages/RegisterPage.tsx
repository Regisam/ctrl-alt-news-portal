import { useState } from "react";
import { useLocation, Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [lang, setLang] = useState<"en" | "pt">("en");

  const handleLangChange = (newLang: "en" | "pt") => {
    setLang(newLang);
  };

  const t = {
    en: {
      title: "Create Account",
      subtitle: "Join our community",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      register: "Register",
      alreadyHaveAccount: "Already have an account?",
      login: "Login here",
      passwordRequirement: "At least 8 characters",
      registering: "Registering...",
      error: "Registration failed. Please try again.",
    },
    pt: {
      title: "Criar Conta",
      subtitle: "Junte-se à nossa comunidade",
      email: "Email",
      password: "Senha",
      confirmPassword: "Confirmar Senha",
      register: "Registrar",
      alreadyHaveAccount: "Já tem uma conta?",
      login: "Faça login aqui",
      passwordRequirement: "Mínimo 8 caracteres",
      registering: "Registrando...",
      error: "Falha no registro. Tente novamente.",
    },
  };

  const strings = t[lang];

  function validateForm(): FormErrors {
    const newErrors: FormErrors = {};

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setSubmitError(data.error || strings.error);
        }
        return;
      }

      // Registration successful - redirect to login
      navigate("/login");
    } catch (error) {
      setSubmitError(strings.error);
      console.error("Registration error:", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header lang={lang} onLangChange={handleLangChange} />
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ maxWidth: "400px", width: "100%" }}>
          <h1 style={{ marginBottom: "8px", textAlign: "center" }}>{strings.title}</h1>
          <p style={{ textAlign: "center", opacity: 0.7, marginBottom: "40px" }}>{strings.subtitle}</p>

          {submitError && (
            <div
              style={{
                padding: "12px",
                marginBottom: "20px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid #ef4444",
                borderRadius: "4px",
                color: "#ef4444",
                fontSize: "0.9rem",
              }}
            >
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "0.9rem" }}>
                {strings.email}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: `1px solid ${errors.email ? "#ef4444" : "rgba(255,255,255,0.2)"}`,
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.05)",
                  color: "#e2e8f0",
                  fontFamily: "var(--font-body)",
                  boxSizing: "border-box",
                }}
              />
              {errors.email && <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "4px" }}>{errors.email}</p>}
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "0.9rem" }}>
                {strings.password}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: `1px solid ${errors.password ? "#ef4444" : "rgba(255,255,255,0.2)"}`,
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.05)",
                  color: "#e2e8f0",
                  fontFamily: "var(--font-body)",
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "4px" }}>{strings.passwordRequirement}</p>
              {errors.password && <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "4px" }}>{errors.password}</p>}
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "0.9rem" }}>
                {strings.confirmPassword}
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => {
                  setForm({ ...form, confirmPassword: e.target.value });
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: `1px solid ${errors.confirmPassword ? "#ef4444" : "rgba(255,255,255,0.2)"}`,
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.05)",
                  color: "#e2e8f0",
                  fontFamily: "var(--font-body)",
                  boxSizing: "border-box",
                }}
              />
              {errors.confirmPassword && (
                <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "4px" }}>{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px",
                marginTop: "20px",
                background: "#00D4FF",
                border: "none",
                borderRadius: "4px",
                color: "#0a0e27",
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? strings.registering : strings.register}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.9rem" }}>
            {strings.alreadyHaveAccount}{" "}
            <Link href="/login" style={{ color: "#00D4FF", textDecoration: "none" }}>
              {strings.login}
            </Link>
          </p>
        </div>
      </main>
      <Footer lang={lang} />
    </div>
  );
}
