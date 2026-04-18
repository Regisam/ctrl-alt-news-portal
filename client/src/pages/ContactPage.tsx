// CTRL + ALT News — Contact Page
// Design: Cyberpunk Brutalism — deep matte charcoal, neon accents, glassmorphism
// Layout: Header → two-column form + info → footer

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, MessageSquare, Send, AlertCircle, CheckCircle2, Cpu } from "lucide-react";

type FormField = { value: string; error: string };
type FormState = {
  name: FormField;
  email: FormField;
  subject: FormField;
  message: FormField;
};

const INITIAL_FORM: FormState = {
  name:    { value: "", error: "" },
  email:   { value: "", error: "" },
  subject: { value: "", error: "" },
  message: { value: "", error: "" },
};

const CONTACT_TOPICS = {
  en: ["Editorial Enquiry", "Press & Media", "Advertising", "Technical Issue", "Partnership", "Other"],
  pt: ["Dúvida Editorial", "Imprensa & Mídia", "Publicidade", "Problema Técnico", "Parceria", "Outro"],
};

const CONTACT_INFO = [
  {
    icon: Mail,
    color: "#00D4FF",
    label: { en: "Editorial", pt: "Editorial" },
    value: "editorial@ctrlaltnews.io",
  },
  {
    icon: MessageSquare,
    color: "#A855F7",
    label: { en: "Press & Media", pt: "Imprensa & Mídia" },
    value: "press@ctrlaltnews.io",
  },
  {
    icon: Send,
    color: "#F97316",
    label: { en: "Advertising", pt: "Publicidade" },
    value: "ads@ctrlaltnews.io",
  },
];

export default function ContactPage() {
  const [lang, setLang] = useState<"en" | "pt">("en");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleLangChange(newLang: "en" | "pt") {
    setLang(newLang);
    localStorage.setItem("ctrl-alt-lang", newLang);
    document.documentElement.lang = newLang === "pt" ? "pt-BR" : "en-UK";
  }

   
  useEffect(() => {
    const stored = localStorage.getItem("ctrl-alt-lang") as "en" | "pt" | null;
    if (stored) setLang(stored);
    const handler = () => {
      const updated = localStorage.getItem("ctrl-alt-lang") as "en" | "pt" | null;
      if (updated) setLang(updated);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const t = {
    en: {
      heroLabel: "CONTACT",
      heroTitle: "Get in Touch",
      heroSub: "Questions, tips, press enquiries, or partnership proposals — we read every message and respond within two business days.",
      formTitle: "Send a Message",
      namePlaceholder: "Your full name",
      emailPlaceholder: "your@email.com",
      subjectLabel: "Topic",
      messagePlaceholder: "Tell us what's on your mind…",
      submitBtn: "Send Message",
      submittingBtn: "Sending…",
      successTitle: "Message received!",
      successBody: "Thank you for reaching out. Our team will get back to you within two business days.",
      sendAnother: "Send another message",
      contactInfoTitle: "Other Ways to Reach Us",
      responseTime: "Response time: 1–2 business days",
      nameError: "Please enter your name.",
      emailError: "Please enter a valid email address.",
      subjectError: "Please select a topic.",
      messageError: "Please write a message (minimum 20 characters).",
      nameLabel: "Name",
      emailLabel: "Email",
      messageLabel: "Message",
    },
    pt: {
      heroLabel: "CONTATO",
      heroTitle: "Entre em Contato",
      heroSub: "Dúvidas, dicas, consultas de imprensa ou propostas de parceria — lemos cada mensagem e respondemos em até dois dias úteis.",
      formTitle: "Enviar uma Mensagem",
      namePlaceholder: "Seu nome completo",
      emailPlaceholder: "seu@email.com",
      subjectLabel: "Assunto",
      messagePlaceholder: "Nos diga o que está em sua mente…",
      submitBtn: "Enviar Mensagem",
      submittingBtn: "Enviando…",
      successTitle: "Mensagem recebida!",
      successBody: "Obrigado por entrar em contato. Nossa equipe retornará em até dois dias úteis.",
      sendAnother: "Enviar outra mensagem",
      contactInfoTitle: "Outras Formas de Nos Contatar",
      responseTime: "Tempo de resposta: 1–2 dias úteis",
      nameError: "Por favor, insira seu nome.",
      emailError: "Por favor, insira um endereço de e-mail válido.",
      subjectError: "Por favor, selecione um assunto.",
      messageError: "Por favor, escreva uma mensagem (mínimo 20 caracteres).",
      nameLabel: "Nome",
      emailLabel: "E-mail",
      messageLabel: "Mensagem",
    },
  }[lang];

  function validate(): boolean {
    const next = { ...form };
    let valid = true;

    if (!form.name.value.trim()) {
      next.name = { ...next.name, error: t.nameError };
      valid = false;
    } else {
      next.name = { ...next.name, error: "" };
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.email.value.trim())) {
      next.email = { ...next.email, error: t.emailError };
      valid = false;
    } else {
      next.email = { ...next.email, error: "" };
    }

    if (!form.subject.value) {
      next.subject = { ...next.subject, error: t.subjectError };
      valid = false;
    } else {
      next.subject = { ...next.subject, error: "" };
    }

    if (form.message.value.trim().length < 20) {
      next.message = { ...next.message, error: t.messageError };
      valid = false;
    } else {
      next.message = { ...next.message, error: "" };
    }

    setForm(next);
    return valid;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    // Simulate async submission
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1200);
  }

  function handleField(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: { value, error: "" } }));
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    padding: "12px 14px",
    color: "#F0F0F5",
    fontSize: "0.9rem",
    fontFamily: "var(--font-body)",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "rgba(240,240,245,0.5)",
    fontFamily: "var(--font-mono)",
    marginBottom: "6px",
    textTransform: "uppercase",
  };

  const errorStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#EF4444",
    fontSize: "0.75rem",
    marginTop: "6px",
  };

  return (
    <div style={{ background: "#0A0A0B", minHeight: "100vh", color: "#F0F0F5" }}>
      <Header lang={lang} onLangChange={handleLangChange} />

      {/* Hero */}
      <section
        style={{
          padding: "80px 0 60px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-60px",
            left: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div className="container" style={{ maxWidth: "860px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(168,85,247,0.08)",
              border: "1px solid rgba(168,85,247,0.25)",
              borderRadius: "4px",
              padding: "4px 12px",
              marginBottom: "24px",
            }}
          >
            <Cpu size={12} color="#A855F7" aria-hidden="true" />
            <span
              style={{
                color: "#A855F7",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                fontFamily: "var(--font-mono)",
              }}
            >
              {t.heroLabel}
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#F0F0F5",
              marginBottom: "20px",
            }}
          >
            {t.heroTitle}
          </h1>
          <p style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "rgba(240,240,245,0.6)", maxWidth: "600px" }}>
            {t.heroSub}
          </p>
        </div>
      </section>

      {/* Content */}
      <div
        className="container"
        style={{
          maxWidth: "1000px",
          padding: "64px 24px",
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: "48px",
          alignItems: "start",
        }}
      >
        {/* Form */}
        <section aria-labelledby="contact-form-heading">
          <h2
            id="contact-form-heading"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.4rem",
              fontWeight: 800,
              color: "#F0F0F5",
              marginBottom: "28px",
              letterSpacing: "-0.01em",
            }}
          >
            {t.formTitle}
          </h2>

          {submitted ? (
            <div
              role="alert"
              aria-live="polite"
              style={{
                background: "rgba(0,212,255,0.06)",
                border: "1px solid rgba(0,212,255,0.2)",
                borderRadius: "8px",
                padding: "40px 32px",
                textAlign: "center",
              }}
            >
              <CheckCircle2 size={40} color="#00D4FF" style={{ margin: "0 auto 16px" }} aria-hidden="true" />
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  color: "#00D4FF",
                  marginBottom: "12px",
                }}
              >
                {t.successTitle}
              </h3>
              <p style={{ color: "rgba(240,240,245,0.6)", marginBottom: "24px", lineHeight: 1.7 }}>
                {t.successBody}
              </p>
              <button
                type="button"
                onClick={() => { setSubmitted(false); setForm(INITIAL_FORM); }}
                style={{
                  background: "rgba(0,212,255,0.12)",
                  border: "1px solid rgba(0,212,255,0.3)",
                  borderRadius: "6px",
                  color: "#00D4FF",
                  padding: "10px 24px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}
              >
                {t.sendAnother}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Name */}
              <div>
                <label htmlFor="contact-name" style={labelStyle}>{t.nameLabel}</label>
                <input
                  id="contact-name"
                  type="text"
                  autoComplete="name"
                  placeholder={t.namePlaceholder}
                  value={form.name.value}
                  onChange={e => handleField("name", e.target.value)}
                  aria-invalid={!!form.name.error}
                  aria-describedby={form.name.error ? "name-error" : undefined}
                  style={{
                    ...inputStyle,
                    borderColor: form.name.error ? "#EF4444" : "rgba(255,255,255,0.1)",
                  }}
                />
                {form.name.error && (
                  <div id="name-error" role="alert" style={errorStyle}>
                    <AlertCircle size={12} aria-hidden="true" />
                    {form.name.error}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="contact-email" style={labelStyle}>{t.emailLabel}</label>
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  placeholder={t.emailPlaceholder}
                  value={form.email.value}
                  onChange={e => handleField("email", e.target.value)}
                  aria-invalid={!!form.email.error}
                  aria-describedby={form.email.error ? "email-error" : undefined}
                  style={{
                    ...inputStyle,
                    borderColor: form.email.error ? "#EF4444" : "rgba(255,255,255,0.1)",
                  }}
                />
                {form.email.error && (
                  <div id="email-error" role="alert" style={errorStyle}>
                    <AlertCircle size={12} aria-hidden="true" />
                    {form.email.error}
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="contact-subject" style={labelStyle}>{t.subjectLabel}</label>
                <select
                  id="contact-subject"
                  value={form.subject.value}
                  onChange={e => handleField("subject", e.target.value)}
                  aria-invalid={!!form.subject.error}
                  aria-describedby={form.subject.error ? "subject-error" : undefined}
                  style={{
                    ...inputStyle,
                    borderColor: form.subject.error ? "#EF4444" : "rgba(255,255,255,0.1)",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="" style={{ background: "#0A0A0B" }}>—</option>
                  {CONTACT_TOPICS[lang].map(topic => (
                    <option key={topic} value={topic} style={{ background: "#0A0A0B" }}>{topic}</option>
                  ))}
                </select>
                {form.subject.error && (
                  <div id="subject-error" role="alert" style={errorStyle}>
                    <AlertCircle size={12} aria-hidden="true" />
                    {form.subject.error}
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label htmlFor="contact-message" style={labelStyle}>{t.messageLabel}</label>
                <textarea
                  id="contact-message"
                  rows={6}
                  placeholder={t.messagePlaceholder}
                  value={form.message.value}
                  onChange={e => handleField("message", e.target.value)}
                  aria-invalid={!!form.message.error}
                  aria-describedby={form.message.error ? "message-error" : undefined}
                  style={{
                    ...inputStyle,
                    borderColor: form.message.error ? "#EF4444" : "rgba(255,255,255,0.1)",
                    resize: "vertical",
                    minHeight: "140px",
                  }}
                />
                {form.message.error && (
                  <div id="message-error" role="alert" style={errorStyle}>
                    <AlertCircle size={12} aria-hidden="true" />
                    {form.message.error}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background: submitting ? "rgba(0,212,255,0.1)" : "rgba(0,212,255,0.15)",
                  border: "1px solid rgba(0,212,255,0.4)",
                  borderRadius: "6px",
                  color: "#00D4FF",
                  padding: "14px 28px",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-body)",
                  cursor: submitting ? "not-allowed" : "pointer",
                  letterSpacing: "0.04em",
                  transition: "all 0.2s",
                  alignSelf: "flex-start",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                <Send size={15} aria-hidden="true" />
                {submitting ? t.submittingBtn : t.submitBtn}
              </button>
            </form>
          )}
        </section>

        {/* Contact Info Sidebar */}
        <aside aria-labelledby="contact-info-heading">
          <h2
            id="contact-info-heading"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              fontWeight: 800,
              color: "#F0F0F5",
              marginBottom: "20px",
              letterSpacing: "-0.01em",
            }}
          >
            {t.contactInfoTitle}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {CONTACT_INFO.map(info => {
              const Icon = info.icon;
              return (
                <div
                  key={info.value}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderLeft: `3px solid ${info.color}`,
                    borderRadius: "6px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <Icon size={14} color={info.color} aria-hidden="true" />
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: info.color,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      {info.label[lang]}
                    </span>
                  </div>
                  <a
                    href={`mailto:${info.value}`}
                    style={{
                      color: "rgba(240,240,245,0.6)",
                      fontSize: "0.82rem",
                      textDecoration: "none",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {info.value}
                  </a>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: "20px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "6px",
              padding: "14px 16px",
              fontSize: "0.78rem",
              color: "rgba(240,240,245,0.35)",
              fontFamily: "var(--font-mono)",
              lineHeight: 1.6,
            }}
          >
            {t.responseTime}
          </div>
        </aside>
      </div>

      <Footer lang={lang} />
    </div>
  );
}
