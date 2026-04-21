// CTRL + ALT News — Terms of Use Page
// Design: Cyberpunk Brutalism — dark glassmorphism, neon accents, sticky TOC
// Bilingual: EN-UK / PT-BR

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { FileText, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/hooks/useLanguage";

// ─── Content ──────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "acceptance",
    title: { en: "1. Acceptance of Terms", pt: "1. Aceitação dos Termos" },
    body: {
      en: `By accessing or using the CTRL + ALT News website (the "Site"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, please do not use the Site.\n\nThese Terms apply to all visitors, readers, and contributors. We reserve the right to update these Terms at any time. Continued use of the Site after changes are published constitutes your acceptance of the revised Terms. The date of the most recent revision appears at the bottom of this page.`,
      pt: `Ao acessar ou usar o site da CTRL + ALT News (o "Site"), você concorda em estar vinculado a estes Termos de Uso ("Termos"). Se você não concordar com estes Termos, por favor, não use o Site.\n\nEstes Termos se aplicam a todos os visitantes, leitores e colaboradores. Reservamo-nos o direito de atualizar estes Termos a qualquer momento. O uso continuado do Site após a publicação de alterações constitui sua aceitação dos Termos revisados. A data da revisão mais recente aparece no final desta página.`,
    },
  },
  {
    id: "use",
    title: { en: "2. Permitted Use", pt: "2. Uso Permitido" },
    body: {
      en: `You may use the Site for personal, non-commercial purposes only. You agree not to:\n\n• Reproduce, duplicate, copy, sell, or exploit any portion of the Site without express written permission from CTRL + ALT News.\n• Use the Site in any way that violates applicable local, national, or international laws or regulations.\n• Transmit any unsolicited or unauthorised advertising or promotional material (spam).\n• Attempt to gain unauthorised access to any part of the Site or its related systems.\n• Use automated tools (bots, scrapers, crawlers) to extract content from the Site without prior written consent.\n\nWe reserve the right to terminate access to the Site for any user who violates these Terms.`,
      pt: `Você pode usar o Site apenas para fins pessoais e não comerciais. Você concorda em não:\n\n• Reproduzir, duplicar, copiar, vender ou explorar qualquer parte do Site sem permissão expressa por escrito da CTRL + ALT News.\n• Usar o Site de qualquer forma que viole leis ou regulamentos locais, nacionais ou internacionais aplicáveis.\n• Transmitir qualquer publicidade ou material promocional não solicitado ou não autorizado (spam).\n• Tentar obter acesso não autorizado a qualquer parte do Site ou seus sistemas relacionados.\n• Usar ferramentas automatizadas (bots, scrapers, crawlers) para extrair conteúdo do Site sem consentimento prévio por escrito.\n\nReservamo-nos o direito de encerrar o acesso ao Site para qualquer usuário que viole estes Termos.`,
    },
  },
  {
    id: "ip",
    title: { en: "3. Intellectual Property", pt: "3. Propriedade Intelectual" },
    body: {
      en: `All content published on the Site — including but not limited to articles, images, graphics, logos, and code — is the property of CTRL + ALT News or its content suppliers and is protected by applicable copyright, trademark, and other intellectual property laws.\n\nYou may share links to our articles and quote brief excerpts (up to 150 words) for commentary or educational purposes, provided you attribute the content to CTRL + ALT News and include a direct link to the original article. Any other use of our content requires prior written permission.\n\nThe CTRL + ALT News name, logo, and mascot are trademarks of CTRL + ALT News. You may not use them without our express written consent.`,
      pt: `Todo o conteúdo publicado no Site — incluindo, mas não se limitando a artigos, imagens, gráficos, logotipos e código — é propriedade da CTRL + ALT News ou de seus fornecedores de conteúdo e é protegido pelas leis aplicáveis de direitos autorais, marcas registradas e outras leis de propriedade intelectual.\n\nVocê pode compartilhar links para nossos artigos e citar breves trechos (até 150 palavras) para fins de comentário ou educacionais, desde que atribua o conteúdo à CTRL + ALT News e inclua um link direto para o artigo original. Qualquer outro uso de nosso conteúdo requer permissão prévia por escrito.\n\nO nome CTRL + ALT News, o logotipo e o mascote são marcas registradas da CTRL + ALT News. Você não pode usá-los sem nosso consentimento expresso por escrito.`,
    },
  },
  {
    id: "ugc",
    title: { en: "4. User-Generated Content", pt: "4. Conteúdo Gerado pelo Usuário" },
    body: {
      en: `By submitting comments or other content to the Site, you grant CTRL + ALT News a non-exclusive, royalty-free, perpetual, and worldwide licence to use, reproduce, modify, and display that content in connection with the Site.\n\nYou are solely responsible for any content you submit. You agree not to post content that is unlawful, defamatory, harassing, obscene, or that infringes any third party's intellectual property rights. We reserve the right to remove any user-submitted content at our sole discretion and without notice.\n\nComments are moderated. We do not pre-screen all submissions but will act promptly on reports of policy violations.`,
      pt: `Ao enviar comentários ou outro conteúdo ao Site, você concede à CTRL + ALT News uma licença não exclusiva, isenta de royalties, perpétua e mundial para usar, reproduzir, modificar e exibir esse conteúdo em conexão com o Site.\n\nVocê é o único responsável por qualquer conteúdo que enviar. Você concorda em não publicar conteúdo ilegal, difamatório, assediante, obsceno ou que infrinja os direitos de propriedade intelectual de terceiros. Reservamo-nos o direito de remover qualquer conteúdo enviado por usuários a nosso exclusivo critério e sem aviso prévio.\n\nOs comentários são moderados. Não pré-selecionamos todos os envios, mas agiremos prontamente em relatos de violações de política.`,
    },
  },
  {
    id: "disclaimer",
    title: { en: "5. Editorial Disclaimer", pt: "5. Aviso Editorial" },
    body: {
      en: `The content published on CTRL + ALT News is intended for general informational purposes only. While we strive for accuracy and timeliness, we make no warranties — express or implied — regarding the completeness, accuracy, reliability, or suitability of any information on the Site.\n\nOur editorial team is independent. Advertising relationships, affiliate partnerships, and sponsored content do not influence our editorial coverage. Sponsored content is always clearly labelled as such.\n\nNothing on this Site constitutes professional advice of any kind (legal, financial, medical, or otherwise). Always seek the advice of a qualified professional before making decisions based on information published here.`,
      pt: `O conteúdo publicado na CTRL + ALT News destina-se apenas a fins informativos gerais. Embora nos esforcemos pela precisão e atualidade, não fazemos garantias — expressas ou implícitas — quanto à integridade, precisão, confiabilidade ou adequação de qualquer informação no Site.\n\nNossa equipe editorial é independente. Relações publicitárias, parcerias de afiliados e conteúdo patrocinado não influenciam nossa cobertura editorial. O conteúdo patrocinado é sempre claramente identificado como tal.\n\nNada neste Site constitui aconselhamento profissional de qualquer tipo (jurídico, financeiro, médico ou outro). Sempre procure o conselho de um profissional qualificado antes de tomar decisões com base nas informações publicadas aqui.`,
    },
  },
  {
    id: "third-party",
    title: { en: "6. Third-Party Links", pt: "6. Links de Terceiros" },
    body: {
      en: `The Site may contain links to third-party websites or services that are not owned or controlled by CTRL + ALT News. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites.\n\nWe strongly advise you to read the terms and privacy policy of any third-party site you visit. The inclusion of a link does not imply endorsement by CTRL + ALT News.`,
      pt: `O Site pode conter links para sites ou serviços de terceiros que não são de propriedade ou controlados pela CTRL + ALT News. Não temos controle sobre, e não assumimos responsabilidade pelo conteúdo, políticas de privacidade ou práticas de sites de terceiros.\n\nAconselhamos fortemente que você leia os termos e a política de privacidade de qualquer site de terceiros que visitar. A inclusão de um link não implica endosso pela CTRL + ALT News.`,
    },
  },
  {
    id: "liability",
    title: { en: "7. Limitation of Liability", pt: "7. Limitação de Responsabilidade" },
    body: {
      en: `To the fullest extent permitted by applicable law, CTRL + ALT News, its directors, employees, partners, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including loss of profits, data, or goodwill — arising from your use of, or inability to use, the Site or its content.\n\nIn no event shall our total liability to you for all claims exceed the amount you paid us, if any, in the twelve months preceding the claim. Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability, so some of the above limitations may not apply to you.`,
      pt: `Na máxima extensão permitida pela lei aplicável, a CTRL + ALT News, seus diretores, funcionários, parceiros e agentes não serão responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos — incluindo perda de lucros, dados ou boa vontade — decorrentes do seu uso, ou incapacidade de usar, o Site ou seu conteúdo.\n\nEm nenhum caso nossa responsabilidade total para com você por todas as reclamações excederá o valor que você nos pagou, se houver, nos doze meses anteriores à reclamação. Algumas jurisdições não permitem a exclusão de certas garantias ou a limitação de responsabilidade, portanto, algumas das limitações acima podem não se aplicar a você.`,
    },
  },
  {
    id: "governing-law",
    title: { en: "8. Governing Law", pt: "8. Lei Aplicável" },
    body: {
      en: `These Terms shall be governed by and construed in accordance with the laws of England and Wales, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.\n\nFor users in Brazil, these Terms are also subject to the Brazilian Consumer Defence Code (CDC) and the Brazilian General Data Protection Law (LGPD — Lei nº 13.709/2018) where applicable.`,
      pt: `Estes Termos serão regidos e interpretados de acordo com as leis da Inglaterra e do País de Gales, sem levar em conta suas disposições sobre conflito de leis. Quaisquer disputas decorrentes destes Termos estarão sujeitas à jurisdição exclusiva dos tribunais da Inglaterra e do País de Gales.\n\nPara usuários no Brasil, estes Termos também estão sujeitos ao Código de Defesa do Consumidor (CDC) e à Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018) onde aplicável.`,
    },
  },
  {
    id: "contact",
    title: { en: "9. Contact", pt: "9. Contato" },
    body: {
      en: `If you have any questions about these Terms of Use, please contact us:\n\nEmail: legal@ctrlaltnews.io\nEditorial: editorial@ctrlaltnews.io\nPress: press@ctrlaltnews.io\n\nWe aim to respond to all enquiries within 5 business days.`,
      pt: `Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco:\n\nE-mail: legal@ctrlaltnews.io\nEditorial: editorial@ctrlaltnews.io\nImprensa: press@ctrlaltnews.io\n\nNos esforçamos para responder a todas as consultas em até 5 dias úteis.`,
    },
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TermsPage() {
  const { lang, setLang } = useLanguage();
  const [activeSection, setActiveSection] = useState("acceptance");

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const t = {
    en: {
      badge: "Legal",
      title: "Terms of Use",
      subtitle: "Please read these terms carefully before using CTRL + ALT News.",
      lastUpdated: "Last updated: 1 March 2026",
      toc: "Contents",
      backHome: "← Back to Home",
    },
    pt: {
      badge: "Legal",
      title: "Termos de Uso",
      subtitle: "Por favor, leia estes termos com atenção antes de usar a CTRL + ALT News.",
      lastUpdated: "Última atualização: 1 de março de 2026",
      toc: "Índice",
      backHome: "← Voltar ao Início",
    },
  }[lang];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0", fontFamily: "var(--font-body)" }}>
      <Header lang={lang} onLangChange={setLang} />

      {/* Hero */}
      <section
        style={{
          padding: "80px 0 48px",
          background: "linear-gradient(180deg, rgba(0,212,255,0.04) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(0,212,255,0.1)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.82rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
            {t.backHome}
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <span style={{ background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.3)", color: "#00D4FF", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.12em", padding: "4px 10px", borderRadius: "4px", textTransform: "uppercase" }}>
              {t.badge}
            </span>
            <FileText size={18} style={{ color: "#00D4FF" }} />
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              marginBottom: "16px",
            }}
          >
            {t.title}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem", maxWidth: "600px", lineHeight: 1.6, marginBottom: "12px" }}>
            {t.subtitle}
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem", letterSpacing: "0.06em" }}>
            {t.lastUpdated}
          </p>
        </div>
      </section>

      {/* Main layout */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "48px 24px 80px",
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: "48px",
          alignItems: "start",
        }}
        className="terms-layout"
      >
        {/* Article content */}
        <main>
          {SECTIONS.map((section) => (
            <article
              key={section.id}
              id={section.id}
              style={{
                marginBottom: "48px",
                paddingBottom: "48px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "0.02em",
                  marginBottom: "16px",
                  paddingBottom: "12px",
                  borderBottom: "2px solid #00D4FF",
                  display: "inline-block",
                }}
              >
                {section.title[lang]}
              </h2>
              <div style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.85, fontSize: "0.95rem" }}>
                {section.body[lang].split("\n\n").map((para, i) => (
                  <p key={i} style={{ marginBottom: "16px", whiteSpace: "pre-line" }}>
                    {para}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </main>

        {/* Sticky TOC sidebar */}
        <aside style={{ position: "sticky", top: "88px" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(0,212,255,0.15)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <div style={{ width: "28px", height: "2px", background: "#00D4FF", marginBottom: "10px", borderRadius: "2px" }} />
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#fff",
                marginBottom: "16px",
              }}
            >
              {t.toc}
            </h3>
            <nav>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                {SECTIONS.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" });
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: isActive ? 700 : 400,
                          color: isActive ? "#00D4FF" : "rgba(255,255,255,0.45)",
                          background: isActive ? "rgba(0,212,255,0.08)" : "transparent",
                          textDecoration: "none",
                          transition: "all 0.2s",
                          borderLeft: isActive ? "2px solid #00D4FF" : "2px solid transparent",
                        }}
                      >
                        {isActive && <ChevronRight size={12} />}
                        {section.title[lang]}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Privacy link */}
          <div
            style={{
              marginTop: "16px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "10px",
              padding: "16px",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.6,
            }}
          >
            {lang === "en"
              ? "Also see our "
              : "Veja também nossa "}
            <Link href="/privacy" style={{ color: "#00D4FF", textDecoration: "none" }}>
              {lang === "en" ? "Privacy Policy" : "Política de Privacidade"}
            </Link>
            {lang === "en" ? " for information on how we handle your data." : " para informações sobre como tratamos seus dados."}
          </div>
        </aside>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .terms-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <Footer lang={lang} />
    </div>
  );
}
