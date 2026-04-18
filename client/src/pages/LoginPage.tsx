import { useState } from "react";
import { useLocation, Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
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
      title: "Login",
      subtitle: "Welcome back",
      email: "Email",
      password: "Password",
      login: "Login",
      noAccount: "Don't have an account?",
      register: "Register here",
      loggingIn: "Logging in...",
      error: "Login failed. Please try again.",
    },
    pt: {
      title: "Entrar",
      subtitle: "Bem-vindo de volta",
      email: "Email",
      password: "Senha",
      login: "Entrar",
      noAccount: "Não tem uma conta?",
      register: "Registre-se aqui",
      loggingIn: "Entrando...",
      error: "Falha no login. Tente novamente.",
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
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

      // Store token in localStorage
      localStorage.setItem("auth_token", data.data.token);

      // Redirect to profile
      navigate("/profile/me");
    } catch (error) {
      setSubmitError(strings.error);
      console.error("Login error:", error);
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
              {errors.password && <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "4px" }}>{errors.password}</p>}
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
              {submitting ? strings.loggingIn : strings.login}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.9rem" }}>
            {strings.noAccount}{" "}
            <Link href="/register" style={{ color: "#00D4FF", textDecoration: "none" }}>
              {strings.register}
            </Link>
          </p>
        </div>
      </main>
      <Footer lang={lang} />
    </div>
  );
}
