// CTRL + ALT News — Privacy Policy Page
// Design: Cyberpunk Brutalism — deep matte charcoal, neon accents
// Layout: Header → document-style content → footer

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, Cpu } from "lucide-react";

interface Section {
  id: string;
  title: { en: string; pt: string };
  body: { en: string; pt: string };
}

const SECTIONS: Section[] = [
  {
    id: "information-collected",
    title: { en: "1. Information We Collect", pt: "1. Informações que Coletamos" },
    body: {
      en: `We collect information you provide directly to us, such as when you subscribe to our newsletter, submit a contact form, or post a comment. This may include your name, email address, and the content of your messages.\n\nWe also collect certain information automatically when you visit our website, including your IP address, browser type and version, operating system, referring URLs, pages viewed, and the date and time of your visit. This data is collected through standard server logs and analytics tools.\n\nWe do not collect sensitive personal data such as financial information, health records, or government identification numbers.`,
      pt: `Coletamos informações que você nos fornece diretamente, como ao assinar nossa newsletter, enviar um formulário de contato ou publicar um comentário. Isso pode incluir seu nome, endereço de e-mail e o conteúdo de suas mensagens.\n\nTambém coletamos certas informações automaticamente quando você visita nosso site, incluindo seu endereço IP, tipo e versão do navegador, sistema operacional, URLs de referência, páginas visualizadas e a data e hora da sua visita. Esses dados são coletados por meio de logs de servidor padrão e ferramentas de análise.\n\nNão coletamos dados pessoais sensíveis, como informações financeiras, registros de saúde ou números de identificação governamental.`,
    },
  },
  {
    id: "how-we-use",
    title: { en: "2. How We Use Your Information", pt: "2. Como Usamos Suas Informações" },
    body: {
      en: `We use the information we collect to operate and improve our website, send you the newsletter you subscribed to, respond to your enquiries, and analyse how our content is consumed so we can produce better journalism.\n\nWe do not sell, rent, or share your personal data with third parties for their own marketing purposes. We may share aggregated, anonymised analytics data with our advertising partners, but this data cannot be used to identify you individually.\n\nWe may use your email address to send you transactional messages (e.g., subscription confirmations) and, if you have opted in, our editorial newsletter. You may unsubscribe at any time using the link included in every email.`,
      pt: `Usamos as informações coletadas para operar e melhorar nosso site, enviar a newsletter para a qual você se inscreveu, responder às suas dúvidas e analisar como nosso conteúdo é consumido para que possamos produzir um jornalismo melhor.\n\nNão vendemos, alugamos nem compartilhamos seus dados pessoais com terceiros para fins de marketing próprio. Podemos compartilhar dados de análise agregados e anonimizados com nossos parceiros publicitários, mas esses dados não podem ser usados para identificá-lo individualmente.\n\nPodemos usar seu endereço de e-mail para enviar mensagens transacionais (por exemplo, confirmações de assinatura) e, se você optou por isso, nossa newsletter editorial. Você pode cancelar a assinatura a qualquer momento usando o link incluído em cada e-mail.`,
    },
  },
  {
    id: "cookies",
    title: { en: "3. Cookies and Tracking Technologies", pt: "3. Cookies e Tecnologias de Rastreamento" },
    body: {
      en: `Our website uses cookies — small text files stored on your device — to remember your preferences (such as language selection), maintain session state, and gather analytics data about site usage.\n\nWe use first-party analytics cookies to understand traffic patterns and improve the user experience. We may also use third-party advertising cookies from partners such as Google AdSense to serve relevant advertisements. These third-party cookies are governed by the respective privacy policies of those providers.\n\nYou can control or disable cookies through your browser settings. Note that disabling cookies may affect the functionality of certain features on our website.`,
      pt: `Nosso site usa cookies — pequenos arquivos de texto armazenados no seu dispositivo — para lembrar suas preferências (como a seleção de idioma), manter o estado da sessão e coletar dados de análise sobre o uso do site.\n\nUsamos cookies de análise próprios para entender padrões de tráfego e melhorar a experiência do usuário. Também podemos usar cookies de publicidade de terceiros de parceiros como o Google AdSense para exibir anúncios relevantes. Esses cookies de terceiros são regidos pelas respectivas políticas de privacidade desses provedores.\n\nVocê pode controlar ou desabilitar cookies por meio das configurações do seu navegador. Observe que desabilitar cookies pode afetar a funcionalidade de certos recursos do nosso site.`,
    },
  },
  {
    id: "affiliate-disclosure",
    title: { en: "4. Affiliate Disclosure", pt: "4. Divulgação de Afiliados" },
    body: {
      en: `CTRL + ALT News participates in affiliate marketing programmes. Some links on our website — particularly in product reviews and the Gadgets section — are affiliate links. If you click on an affiliate link and make a purchase, we may receive a commission at no additional cost to you.\n\nAffiliate relationships do not influence our editorial decisions. Our reviews and recommendations are based solely on the merits of the products and services evaluated. We clearly disclose affiliate relationships in the footer of every page and within relevant articles.`,
      pt: `A CTRL + ALT News participa de programas de marketing de afiliados. Alguns links em nosso site — especialmente em avaliações de produtos e na seção de Gadgets — são links de afiliados. Se você clicar em um link de afiliado e fizer uma compra, podemos receber uma comissão sem custo adicional para você.\n\nAs relações de afiliados não influenciam nossas decisões editoriais. Nossas avaliações e recomendações são baseadas exclusivamente nos méritos dos produtos e serviços avaliados. Divulgamos claramente as relações de afiliados no rodapé de cada página e nos artigos relevantes.`,
    },
  },
  {
    id: "data-retention",
    title: { en: "5. Data Retention", pt: "5. Retenção de Dados" },
    body: {
      en: `We retain personal data only for as long as necessary to fulfil the purposes for which it was collected. Newsletter subscriber data is retained until you unsubscribe. Contact form submissions are retained for up to 12 months. Server log data is retained for up to 90 days.\n\nYou may request deletion of your personal data at any time by contacting us at privacy@ctrlaltnews.io. We will process your request within 30 days.`,
      pt: `Retemos dados pessoais apenas pelo tempo necessário para cumprir os fins para os quais foram coletados. Os dados de assinantes de newsletter são retidos até que você cancele a assinatura. Os envios de formulários de contato são retidos por até 12 meses. Os dados de log do servidor são retidos por até 90 dias.\n\nVocê pode solicitar a exclusão de seus dados pessoais a qualquer momento entrando em contato conosco em privacy@ctrlaltnews.io. Processaremos sua solicitação em até 30 dias.`,
    },
  },
  {
    id: "your-rights",
    title: { en: "6. Your Rights", pt: "6. Seus Direitos" },
    body: {
      en: `Depending on your jurisdiction, you may have the following rights regarding your personal data: the right to access the data we hold about you; the right to correct inaccurate data; the right to request deletion of your data; the right to object to or restrict certain processing; and the right to data portability.\n\nResidents of the European Union have additional rights under the General Data Protection Regulation (GDPR). Brazilian residents have rights under the Lei Geral de Proteção de Dados (LGPD). To exercise any of these rights, please contact us at privacy@ctrlaltnews.io.`,
      pt: `Dependendo da sua jurisdição, você pode ter os seguintes direitos em relação aos seus dados pessoais: o direito de acessar os dados que mantemos sobre você; o direito de corrigir dados imprecisos; o direito de solicitar a exclusão de seus dados; o direito de se opor ou restringir determinado processamento; e o direito à portabilidade de dados.\n\nResidentes da União Europeia têm direitos adicionais sob o Regulamento Geral de Proteção de Dados (RGPD). Residentes brasileiros têm direitos sob a Lei Geral de Proteção de Dados (LGPD). Para exercer qualquer um desses direitos, entre em contato conosco em privacy@ctrlaltnews.io.`,
    },
  },
  {
    id: "security",
    title: { en: "7. Security", pt: "7. Segurança" },
    body: {
      en: `We implement reasonable technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction. Our website is served over HTTPS, and access to personal data is restricted to authorised personnel only.\n\nHowever, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security, and we encourage you to use strong, unique passwords and to contact us immediately if you suspect any unauthorised use of your data.`,
      pt: `Implementamos medidas técnicas e organizacionais razoáveis para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Nosso site é servido via HTTPS, e o acesso a dados pessoais é restrito apenas a pessoal autorizado.\n\nNo entanto, nenhum método de transmissão pela internet ou armazenamento eletrônico é 100% seguro. Não podemos garantir segurança absoluta, e encorajamos você a usar senhas fortes e únicas e a nos contatar imediatamente se suspeitar de qualquer uso não autorizado de seus dados.`,
    },
  },
  {
    id: "changes",
    title: { en: "8. Changes to This Policy", pt: "8. Alterações nesta Política" },
    body: {
      en: `We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. When we make material changes, we will update the "Last Updated" date at the top of this page and, where appropriate, notify subscribers by email.\n\nWe encourage you to review this policy periodically. Your continued use of our website after any changes constitutes your acceptance of the updated policy.`,
      pt: `Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas ou na legislação aplicável. Quando fizermos alterações materiais, atualizaremos a data de "Última Atualização" no topo desta página e, quando apropriado, notificaremos os assinantes por e-mail.\n\nEncorajamos você a revisar esta política periodicamente. O uso continuado do nosso site após quaisquer alterações constitui sua aceitação da política atualizada.`,
    },
  },
  {
    id: "contact",
    title: { en: "9. Contact", pt: "9. Contato" },
    body: {
      en: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact our Data Protection Officer at:\n\nprivacy@ctrlaltnews.io\n\nWe aim to respond to all privacy-related enquiries within 10 business days.`,
      pt: `Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade ou nossas práticas de dados, entre em contato com nosso Encarregado de Proteção de Dados em:\n\nprivacy@ctrlaltnews.io\n\nNosso objetivo é responder a todas as consultas relacionadas à privacidade em até 10 dias úteis.`,
    },
  },
];

export default function PrivacyPage() {
  const [lang, setLang] = useState<"en" | "pt">(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("ctrl-alt-lang") as "en" | "pt" | null) || "en";
  });

  function handleLangChange(newLang: "en" | "pt") {
    setLang(newLang);
    localStorage.setItem("ctrl-alt-lang", newLang);
    document.documentElement.lang = newLang === "pt" ? "pt-BR" : "en-UK";
  }

  useEffect(() => {
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
      heroLabel: "LEGAL",
      heroTitle: "Privacy Policy",
      heroSub: "This policy explains how CTRL + ALT News collects, uses, and protects your personal information.",
      lastUpdated: "Last Updated: 25 February 2026",
      tocTitle: "Contents",
    },
    pt: {
      heroLabel: "LEGAL",
      heroTitle: "Política de Privacidade",
      heroSub: "Esta política explica como a CTRL + ALT News coleta, usa e protege suas informações pessoais.",
      lastUpdated: "Última Atualização: 25 de fevereiro de 2026",
      tocTitle: "Conteúdo",
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
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-60px",
            right: "-80px",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div className="container" style={{ maxWidth: "860px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "4px",
              padding: "4px 12px",
              marginBottom: "24px",
            }}
          >
            <Cpu size={12} color="#EF4444" aria-hidden="true" />
            <span
              style={{
                color: "#EF4444",
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
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#F0F0F5",
              marginBottom: "16px",
            }}
          >
            {t.heroTitle}
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "rgba(240,240,245,0.55)", maxWidth: "600px", marginBottom: "12px" }}>
            {t.heroSub}
          </p>
          <p
            style={{
              fontSize: "0.72rem",
              color: "rgba(240,240,245,0.3)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.05em",
            }}
          >
            {t.lastUpdated}
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
          gridTemplateColumns: "1fr 240px",
          gap: "48px",
          alignItems: "start",
        }}
      >
        {/* Document Body */}
        <article aria-label={lang === "en" ? "Privacy policy document" : "Documento de política de privacidade"}>
          {SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-heading`}
              style={{ marginBottom: "48px" }}
            >
              <h2
                id={`${section.id}-heading`}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  color: "#F0F0F5",
                  marginBottom: "16px",
                  letterSpacing: "-0.01em",
                  paddingBottom: "10px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {section.title[lang]}
              </h2>
              {section.body[lang].split("\n\n").map((para, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: "0.92rem",
                    lineHeight: 1.8,
                    color: "rgba(240,240,245,0.6)",
                    marginBottom: "14px",
                  }}
                >
                  {para}
                </p>
              ))}
            </section>
          ))}
        </article>

        {/* Table of Contents (sticky) */}
        <aside
          aria-labelledby="toc-heading"
          style={{
            position: "sticky",
            top: "100px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "8px",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Shield size={14} color="#EF4444" aria-hidden="true" />
              <h2
                id="toc-heading"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: "rgba(240,240,245,0.4)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                {t.tocTitle}
              </h2>
            </div>
            <nav aria-label={lang === "en" ? "Table of contents" : "Índice"}>
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  style={{
                    display: "block",
                    color: "rgba(240,240,245,0.45)",
                    fontSize: "0.78rem",
                    lineHeight: 1.5,
                    padding: "5px 0",
                    textDecoration: "none",
                    borderLeft: "2px solid transparent",
                    paddingLeft: "10px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "#EF4444";
                    (e.currentTarget as HTMLAnchorElement).style.borderLeftColor = "#EF4444";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "rgba(240,240,245,0.45)";
                    (e.currentTarget as HTMLAnchorElement).style.borderLeftColor = "transparent";
                  }}
                >
                  {section.title[lang]}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      <Footer lang={lang} />
    </div>
  );
}
