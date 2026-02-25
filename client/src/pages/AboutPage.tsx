// CTRL + ALT News — About Page
// Design: Cyberpunk Brutalism — deep matte charcoal, neon accents, glassmorphism
// Layout: Full-width header → constrained content column → footer

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Cpu, Globe, Zap, Users, Award, BookOpen } from "lucide-react";

const TEAM = [
  {
    name: "Dr. Elena Vasquez",
    role: { en: "Editor-in-Chief · AI & Quantum Computing", pt: "Editora-Chefe · IA & Computação Quântica" },
    initials: "EV",
    color: "#00D4FF",
    bio: {
      en: "Former research scientist at MIT CSAIL with a PhD in Machine Learning. Elena leads editorial strategy and covers the intersection of AI and scientific discovery.",
      pt: "Ex-cientista pesquisadora no MIT CSAIL com doutorado em Aprendizado de Máquina. Elena lidera a estratégia editorial e cobre a interseção entre IA e descoberta científica.",
    },
  },
  {
    name: "Marcus Chen",
    role: { en: "Senior Editor · Robotics & Automation", pt: "Editor Sênior · Robótica & Automação" },
    initials: "MC",
    color: "#EF4444",
    bio: {
      en: "Robotics engineer turned journalist. Marcus spent eight years at Boston Dynamics before joining CTRL + ALT News to translate complex engineering into compelling stories.",
      pt: "Engenheiro de robótica reconvertido em jornalista. Marcus passou oito anos na Boston Dynamics antes de ingressar na CTRL + ALT News para transformar engenharia complexa em histórias envolventes.",
    },
  },
  {
    name: "Priya Nair",
    role: { en: "Science Correspondent · Physics & Space", pt: "Correspondente Científica · Física & Espaço" },
    initials: "PN",
    color: "#A855F7",
    bio: {
      en: "Astrophysicist and science communicator. Priya holds a Master's from Caltech and has contributed to Nature, New Scientist, and now brings her expertise exclusively to our readers.",
      pt: "Astrofísica e comunicadora científica. Priya possui mestrado pelo Caltech e já contribuiu para a Nature e a New Scientist; agora traz sua expertise exclusivamente para nossos leitores.",
    },
  },
  {
    name: "James Okafor",
    role: { en: "Gadgets & Consumer Tech Editor", pt: "Editor de Gadgets & Tecnologia de Consumo" },
    initials: "JO",
    color: "#F97316",
    bio: {
      en: "Tech reviewer with over a decade of hands-on testing experience. James has reviewed more than 2,000 devices and is known for his rigorous, no-nonsense benchmark methodology.",
      pt: "Revisor de tecnologia com mais de uma década de experiência em testes práticos. James avaliou mais de 2.000 dispositivos e é conhecido pela sua metodologia de benchmark rigorosa e direta.",
    },
  },
];

const PILLARS = [
  {
    icon: Zap,
    color: "#00D4FF",
    title: { en: "Speed Without Sacrifice", pt: "Velocidade Sem Concessões" },
    body: {
      en: "Breaking news within minutes, but never at the cost of accuracy. Every story is verified before it goes live.",
      pt: "Notícias em minutos, mas jamais à custa da precisão. Cada matéria é verificada antes de ser publicada.",
    },
  },
  {
    icon: BookOpen,
    color: "#A855F7",
    title: { en: "Depth Over Clicks", pt: "Profundidade Acima de Cliques" },
    body: {
      en: "We reject clickbait. Our articles explain the science, the engineering, and the real-world implications — not just the headline.",
      pt: "Rejeitamos clickbait. Nossos artigos explicam a ciência, a engenharia e as implicações reais — não apenas o título.",
    },
  },
  {
    icon: Globe,
    color: "#EF4444",
    title: { en: "Global Perspective", pt: "Perspectiva Global" },
    body: {
      en: "Technology shapes every corner of the planet. We cover breakthroughs from Silicon Valley to São Paulo, from Tokyo to Nairobi.",
      pt: "A tecnologia molda cada canto do planeta. Cobrimos avanços do Vale do Silício a São Paulo, de Tóquio a Nairóbi.",
    },
  },
  {
    icon: Users,
    color: "#F97316",
    title: { en: "Community First", pt: "Comunidade em Primeiro Lugar" },
    body: {
      en: "Our readers are engineers, researchers, students, and curious minds. We write for people who want to understand, not just consume.",
      pt: "Nossos leitores são engenheiros, pesquisadores, estudantes e mentes curiosas. Escrevemos para quem quer entender, não apenas consumir.",
    },
  },
];

const STATS = [
  { value: "2.4M+", label: { en: "Monthly Readers", pt: "Leitores Mensais" } },
  { value: "12K+", label: { en: "Articles Published", pt: "Artigos Publicados" } },
  { value: "48", label: { en: "Countries Reached", pt: "Países Alcançados" } },
  { value: "2019", label: { en: "Year Founded", pt: "Ano de Fundação" } },
];

export default function AboutPage() {
  const [lang, setLang] = useState<"en" | "pt">("en");

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
      heroLabel: "ABOUT US",
      heroTitle: "Built for the Builders of Tomorrow",
      heroSub:
        "CTRL + ALT News is an independent technology journalism outlet dedicated to covering artificial intelligence, science, robotics, and consumer technology with rigour, clarity, and depth.",
      missionTitle: "Our Mission",
      missionBody:
        "We exist to make the future legible. Technology is moving faster than ever — breakthroughs in AI, quantum computing, synthetic biology, and robotics are reshaping civilisation at a pace that outstrips most people's ability to follow. Our mission is to close that gap: to translate the most significant developments in science and technology into stories that are accurate, accessible, and genuinely useful to the people living through this transformation.",
      pillarsTitle: "What We Stand For",
      teamTitle: "The Team",
      statsTitle: "By the Numbers",
      independenceTitle: "Editorial Independence",
      independenceBody:
        "CTRL + ALT News is editorially independent. Our coverage is never influenced by advertisers, sponsors, or investors. We disclose affiliate relationships transparently, and our reviews are conducted without manufacturer interference. If we recommend a product, it is because our editors tested it and believe it delivers genuine value.",
    },
    pt: {
      heroLabel: "SOBRE NÓS",
      heroTitle: "Feito para os Construtores do Amanhã",
      heroSub:
        "A CTRL + ALT News é um veículo independente de jornalismo tecnológico dedicado a cobrir inteligência artificial, ciência, robótica e tecnologia de consumo com rigor, clareza e profundidade.",
      missionTitle: "Nossa Missão",
      missionBody:
        "Existimos para tornar o futuro legível. A tecnologia avança mais rápido do que nunca — avanços em IA, computação quântica, biologia sintética e robótica estão remodelando a civilização em um ritmo que supera a capacidade da maioria das pessoas de acompanhar. Nossa missão é fechar essa lacuna: traduzir os desenvolvimentos mais significativos em ciência e tecnologia em histórias precisas, acessíveis e genuinamente úteis para quem vive essa transformação.",
      pillarsTitle: "Nossos Princípios",
      teamTitle: "A Equipe",
      statsTitle: "Em Números",
      independenceTitle: "Independência Editorial",
      independenceBody:
        "A CTRL + ALT News é editorialmente independente. Nossa cobertura nunca é influenciada por anunciantes, patrocinadores ou investidores. Divulgamos relações de afiliados de forma transparente, e nossas avaliações são conduzidas sem interferência dos fabricantes. Se recomendamos um produto, é porque nossos editores o testaram e acreditam que ele entrega valor real.",
    },
  }[lang];

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
        {/* Background accent */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-80px",
            right: "-120px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div className="container" style={{ maxWidth: "860px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.25)",
              borderRadius: "4px",
              padding: "4px 12px",
              marginBottom: "24px",
            }}
          >
            <Cpu size={12} color="#00D4FF" aria-hidden="true" />
            <span
              style={{
                color: "#00D4FF",
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
          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: 1.7,
              color: "rgba(240,240,245,0.6)",
              maxWidth: "680px",
            }}
          >
            {t.heroSub}
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section
        aria-label={lang === "en" ? "Key statistics" : "Estatísticas principais"}
        style={{
          background: "rgba(255,255,255,0.02)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "32px 0",
        }}
      >
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "24px",
            textAlign: "center",
          }}
        >
          {STATS.map((s) => (
            <div key={s.value}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#00D4FF",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.value}
              </div>
              <div style={{ color: "rgba(240,240,245,0.45)", fontSize: "0.78rem", marginTop: "4px" }}>
                {s.label[lang]}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className="container" style={{ maxWidth: "860px", padding: "64px 24px" }}>

        {/* Mission */}
        <section aria-labelledby="mission-heading" style={{ marginBottom: "64px" }}>
          <h2
            id="mission-heading"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "#F0F0F5",
              marginBottom: "20px",
              letterSpacing: "-0.01em",
            }}
          >
            {t.missionTitle}
          </h2>
          <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "rgba(240,240,245,0.65)" }}>
            {t.missionBody}
          </p>
        </section>

        {/* Pillars */}
        <section aria-labelledby="pillars-heading" style={{ marginBottom: "64px" }}>
          <h2
            id="pillars-heading"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "#F0F0F5",
              marginBottom: "32px",
              letterSpacing: "-0.01em",
            }}
          >
            {t.pillarsTitle}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title.en}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid rgba(255,255,255,0.07)`,
                    borderLeft: `3px solid ${p.color}`,
                    borderRadius: "6px",
                    padding: "24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <Icon size={18} color={p.color} aria-hidden="true" />
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: p.color,
                        margin: 0,
                      }}
                    >
                      {p.title[lang]}
                    </h3>
                  </div>
                  <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(240,240,245,0.55)", margin: 0 }}>
                    {p.body[lang]}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Team */}
        <section aria-labelledby="team-heading" style={{ marginBottom: "64px" }}>
          <h2
            id="team-heading"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "#F0F0F5",
              marginBottom: "32px",
              letterSpacing: "-0.01em",
            }}
          >
            {t.teamTitle}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
            {TEAM.map((member) => (
              <div
                key={member.name}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "8px",
                  padding: "24px",
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: `${member.color}22`,
                    border: `2px solid ${member.color}55`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: member.color,
                    flexShrink: 0,
                  }}
                >
                  {member.initials}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "#F0F0F5",
                      marginBottom: "2px",
                    }}
                  >
                    {member.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: member.color,
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.05em",
                      marginBottom: "10px",
                    }}
                  >
                    {member.role[lang]}
                  </div>
                  <p style={{ fontSize: "0.85rem", lineHeight: 1.65, color: "rgba(240,240,245,0.5)", margin: 0 }}>
                    {member.bio[lang]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Editorial Independence */}
        <section
          aria-labelledby="independence-heading"
          style={{
            background: "rgba(0,212,255,0.04)",
            border: "1px solid rgba(0,212,255,0.15)",
            borderRadius: "8px",
            padding: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Award size={20} color="#00D4FF" aria-hidden="true" />
            <h2
              id="independence-heading"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.2rem",
                fontWeight: 800,
                color: "#00D4FF",
                margin: 0,
              }}
            >
              {t.independenceTitle}
            </h2>
          </div>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.8, color: "rgba(240,240,245,0.6)", margin: 0 }}>
            {t.independenceBody}
          </p>
        </section>
      </div>

      <Footer lang={lang} />
    </div>
  );
}
