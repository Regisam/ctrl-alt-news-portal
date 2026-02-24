# Auditoria Técnica Profissional — CTRL + ALT News
**Padrão 2025-Ready | React 19 + Tailwind CSS v4 + shadcn/ui**

> **Versão auditada:** `598e8568` (backup pré-auditoria preservado)
> **Data:** 24 de fevereiro de 2026
> **Auditor:** Manus AI — Arquiteto de Software Sênior / Tech Lead Frontend
> **Premissa:** Nenhuma alteração de layout ou visual foi realizada. Este documento é exclusivamente analítico e propositivo.

---

## 1. Resumo Executivo

1. **Stack moderna e bem escolhida:** React 19 + Vite 7 + Tailwind CSS v4 (CSS-first) + TypeScript strict — alinhado ao estado da arte de 2025.
2. **Design tokens OKLCH parcialmente implementados:** Os 4 tokens de categoria neon estão definidos em `@theme inline` no CSS, mas são **ignorados nos componentes**, que repetem os valores literais `oklch(...)` diretamente em `style={{}}` (15 ocorrências de `oklch(0.78 0.18 195)` espalhadas por 6 arquivos).
3. **Estilo inline massivo:** 141 ocorrências de `style={{}}` distribuídas entre os 6 componentes customizados — a maior fonte de inconsistência, dificuldade de manutenção e impedimento para responsividade com Tailwind.
4. **Acessibilidade (WCAG 2.2) crítica:** Nenhum `aria-label`, `role`, `sr-only` ou `focus-visible` foi encontrado nos componentes customizados. Botões com ícones (Search, X, Menu) não têm texto acessível. O atributo `lang` do `<html>` não é atualizado dinamicamente quando o usuário troca de idioma.
5. **Hover via `onMouseEnter/Leave` é um anti-pattern:** 28 pares de handlers JS mudam `style` diretamente no DOM — o que deveria ser feito com CSS (`:hover`, `transition`, variáveis CSS). Isso causa re-renders desnecessários e não funciona em dispositivos touch.
6. **shadcn/ui instalado mas não utilizado nos componentes customizados:** Nenhum dos 6 componentes principais importa primitivos de `@/components/ui/`. O `Button`, `Badge`, `Card`, `Input` do shadcn estão disponíveis e prontos — usar eliminaria centenas de linhas de CSS inline.
7. **Tooling incompleto:** Prettier configurado, mas sem `prettier-plugin-tailwindcss`. Sem ESLint. Sem Husky/lint-staged. Sem testes (vitest instalado mas sem nenhum arquivo `.test.`). Sem CI.
8. **Performance:** Imagens sem `loading="lazy"`. Sem `<meta>` Open Graph. Fontes carregadas via Google Fonts (render-blocking em conexões lentas). Nenhum `Suspense` boundary.
9. **`prefers-reduced-motion` ausente:** As animações `fadeInUp` no Hero e os `transform: scale()` nos cards não respeitam a preferência de movimento reduzido do sistema operacional.
10. **Internacionalização incompleta:** O atributo `lang` do `<html>` permanece fixo em `"en"` mesmo quando o usuário seleciona PT-BR — impacto direto em leitores de tela e SEO.

---

## 2. Mapa do Projeto

### Stack Identificada

| Camada | Tecnologia | Versão | Observação |
|---|---|---|---|
| Framework UI | React | 19.2.1 | Sem RSC (projeto estático) |
| Build Tool | Vite | 7.1.7 | `@tailwindcss/vite` plugin |
| CSS Framework | Tailwind CSS | 4.1.14 | **CSS-first**, sem `tailwind.config.*` |
| Componentes | shadcn/ui + Radix UI | — | Instalados, pouco usados nos componentes customizados |
| Roteamento | Wouter | 3.3.5 | Leve, adequado para SPA estática |
| Linguagem | TypeScript | 5.6.3 | `strict: true` ativo |
| Animações | framer-motion | 12.23.22 | Instalado, **não utilizado** |
| Formatação | Prettier | 3.6.2 | Configurado, sem plugin Tailwind |
| Testes | Vitest | 2.1.4 | Instalado, **sem nenhum teste** |
| Variants | class-variance-authority (cva) | 0.7.1 | Instalado, **não utilizado** nos componentes customizados |

### Estrutura de Arquivos

```
client/src/
  components/
    Header.tsx          (273 linhas — 26 style={{}}, 8 onMouseEnter/Leave)
    HeroSection.tsx     (239 linhas — 21 style={{}}, 2 onMouseEnter/Leave)
    TrendingSection.tsx (216 linhas — 25 style={{}}, 2 onMouseEnter/Leave)
    Sidebar.tsx         (268 linhas — 26 style={{}}, 4 onMouseEnter/Leave)
    GadgetsSection.tsx  (316 linhas — 27 style={{}}, 4 onMouseEnter/Leave)
    Footer.tsx          (245 linhas — 16 style={{}}, 8 onMouseEnter/Leave)
    ui/                 (50+ componentes shadcn — bem implementados, com a11y)
  lib/
    data.ts             (164 linhas — dados e URLs de imagens)
    utils.ts            (6 linhas — apenas a função cn())
  pages/
    Home.tsx            (86 linhas — orquestra os componentes)
  index.css             (417 linhas — tokens + @layer components com classes customizadas)
```

---

## 3. Estado do Tailwind e Tema

O projeto usa **Tailwind CSS v4 no modo CSS-first** corretamente: `@import "tailwindcss"` no topo de `index.css`, sem `tailwind.config.js`. O bloco `@theme inline` define os tokens semânticos e os 4 tokens de categoria neon:

```css
/* index.css — perto do topo, dentro de @theme inline */
--color-neon-ai:       oklch(0.78 0.18 195);  /* Teal/Cyan */
--color-neon-science:  oklch(0.65 0.28 300);  /* Vibrant Purple */
--color-neon-robotics: oklch(0.62 0.26 25);   /* Electric Red */
--color-neon-gadgets:  oklch(0.72 0.22 55);   /* Bright Orange */
```

**O problema:** esses tokens existem no CSS mas **nenhum componente os consome**. Em vez de `var(--color-neon-ai)` ou `text-neon-ai` (que o Tailwind v4 geraria automaticamente a partir do `@theme`), todos os componentes repetem os valores literais `oklch(0.78 0.18 195)` diretamente em `style={{}}`.

O tema dark está corretamente configurado em `:root, .dark { ... }` com OKLCH em todas as variáveis semânticas — isso é um ponto positivo e alinhado com o padrão 2025.

---

## 4. Diagnóstico por Categoria

### 4.1 Arquitetura / Componentização (React)

**Estado atual:** Os 6 componentes de página são monolíticos. Cada um contém toda a lógica de renderização, dados de configuração (ex.: `categoryConfig` repetido em `Sidebar.tsx` e `TrendingSection.tsx`), e estilos inline. Não há separação container/presentational, nenhum hook customizado extraído, e nenhum componente primitivo reutilizável (ex.: `CategoryBadge`, `ArticleCard`, `NeonButton`).

**Evidências de duplicação:**

- O objeto `categoryConfig` com as 4 cores neon aparece de forma independente em `Sidebar.tsx` (linha 7) e `TrendingSection.tsx` (linha 10), com estruturas ligeiramente diferentes — violação direta do princípio DRY.
- O padrão de "avatar com iniciais do autor" (div circular com gradiente + initials) aparece em `HeroSection.tsx` (linha 165) e `TrendingSection.tsx` (linha 140) com código praticamente idêntico.
- O padrão de "linha de acento neon na base do card" (div de 2px com gradiente) aparece em `TrendingSection.tsx` (linha 213) e `GadgetsSection.tsx` (linha 238).

**Recomendação:** Extrair os seguintes primitivos para `client/src/components/`:

| Componente | Justificativa | Arquivos afetados |
|---|---|---|
| `CategoryBadge.tsx` | Badge de categoria com cor neon, usado em 4 componentes | Sidebar, Trending, Gadgets, Hero |
| `AuthorAvatar.tsx` | Avatar circular com iniciais e gradiente, usado em 2 componentes | Hero, Trending |
| `NeonAccentLine.tsx` | Linha de 2px com gradiente neon, usada em 2 componentes | Trending, Gadgets |
| `CATEGORY_CONFIG` (constante) | Objeto de configuração de categorias, duplicado em 2 componentes | Sidebar, Trending |

**Prop drilling:** O estado `lang` é passado manualmente por prop para todos os 6 componentes. Para o escopo atual (1 página) isso é aceitável, mas ao escalar para múltiplas páginas, recomenda-se um `LanguageContext` para evitar prop drilling.

### 4.2 Tailwind CSS (Padrões, Conflitos, Variants)

**Estado atual:** O projeto usa Tailwind v4 mas aproveita apenas ~5% de suas capacidades. A grande maioria dos estilos está em `style={{}}` inline ou em classes customizadas no `@layer components`. As classes Tailwind aparecem apenas para responsividade (`hidden md:flex`, `md:hidden`) e animações (`fade-in-up`).

**Problemas identificados:**

**a) Tokens definidos mas não consumidos via Tailwind.** O `@theme inline` expõe `--color-neon-ai`, que o Tailwind v4 transforma automaticamente na utility `text-neon-ai`, `bg-neon-ai`, `border-neon-ai`. Nenhuma dessas utilities é usada. Em vez disso, os componentes usam `style={{ color: 'oklch(0.78 0.18 195)' }}` diretamente.

**b) `@layer components` sobrecarregado.** O arquivo `index.css` tem 417 linhas, com classes como `.glass-card`, `.news-card`, `.amazon-btn`, `.nav-link`, `.trending-card`, `.section-title` — todas com estilos que poderiam ser compostos com Tailwind utilities ou `cva`. O `@apply` não é usado (o que é correto para Tailwind v4), mas as classes CSS customizadas acumulam estilos que deveriam estar nos componentes.

**c) Ausência de `cva` para variants.** O pacote `class-variance-authority` está instalado mas não é usado. O botão GADGETS tem um estilo diferente dos outros nav links, o botão Amazon tem estilo diferente dos outros botões — esses são casos de uso perfeitos para `cva`.

**d) Conflito de estilos:** Em `TrendingSection.tsx` linha 48, `<h2 className="section-title" style={{ color: '#F0F0F5', margin: 0 }}>` — a classe `.section-title` já define `color` via CSS, mas é sobrescrita por `style={{}}`. Isso cria uma cascata ambígua.

**e) Arbitrary values ausentes mas necessários:** As fontes `'Space Grotesk'`, `'Bebas Neue'`, `'Roboto Mono'` são referenciadas como strings literais em dezenas de `style={{}}`. Deveriam ser tokens de fonte no `@theme` e usadas como `font-display`, `font-mono`, `font-body`.

### 4.3 Tokenização / Design Tokens (3 Camadas)

**Estado atual:** O projeto tem uma camada de tokens primitivos (OKLCH no `@theme`) e uma camada semântica parcial (variáveis CSS como `--background`, `--foreground`). A terceira camada (component-level tokens) está ausente.

**Hierarquia atual vs. recomendada:**

| Camada | Estado Atual | Recomendação |
|---|---|---|
| **1. Primitivos** | ✅ `oklch(0.78 0.18 195)` etc. em `@theme` | Manter, adicionar `--color-surface-*` |
| **2. Semânticos** | ⚠️ Parcial — `--background`, `--foreground` OK; faltam `--color-text-muted`, `--color-border-subtle` | Completar com tokens de texto e borda |
| **3. Componente** | ❌ Ausente — valores hardcoded em `style={{}}` | Criar `--btn-primary-bg`, `--card-bg`, etc. |

**Tokens hardcoded que deveriam ser variáveis CSS:**

```
rgba(10,10,11,0.97)  → var(--background) / oklch(0.09 0.008 264)
rgba(255,255,255,0.07) → var(--border)
rgba(240,240,245,0.75) → var(--muted-foreground) (versão mais clara)
#0A0A0B              → var(--background) (hex vs oklch — inconsistência)
#F0F0F5              → var(--foreground) (hex vs oklch — inconsistência)
```

**Inconsistência hex vs. OKLCH:** O `body` em `index.css` usa `background-color: #0A0A0B` (hex) enquanto o `:root` define `--background: oklch(0.09 0.008 264)` — os dois valores são equivalentes, mas a mistura de sistemas de cor é um risco de manutenção.

### 4.4 shadcn/ui + Radix UI

**Estado atual:** 50+ componentes shadcn estão instalados e disponíveis em `client/src/components/ui/`. Eles têm implementação correta de `forwardRef`, `data-state`, composição Radix, `focus-visible`, `aria-*` e integração com CSS variables. **Nenhum deles é importado pelos 6 componentes customizados.**

**Oportunidades de uso imediato (sem alterar layout):**

| Componente shadcn | Onde usar | Benefício |
|---|---|---|
| `Button` (de `ui/button.tsx`) | HeroSection CTA, Amazon buttons, Footer buttons | focus-visible, disabled state, variants via cva |
| `Badge` (de `ui/badge.tsx`) | CategoryBadge em todos os componentes | Consistência visual, a11y |
| `Input` (de `ui/input.tsx`) | Search input no Header, email input no Sidebar | focus-visible, aria, validação |
| `Separator` (de `ui/separator.tsx`) | Divisores entre seções | Semântica HTML (`<hr>` com role) |
| `Skeleton` (de `ui/skeleton.tsx`) | Loading states para imagens e artigos | UX de carregamento |

**Risco de divergência:** Como os componentes shadcn são "copy-paste owned", atualizações manuais podem divergir da versão upstream. Recomenda-se documentar a versão base e manter um `CHANGELOG` de customizações.

### 4.5 Performance (Render, Bundle, Imagens, Vitals)

**Imagens sem `loading="lazy"`:** Todas as 9 imagens do portal (hero, artigos trending, gadgets, sidebar) são carregadas eagerly. Apenas a imagem hero está acima do fold — as demais deveriam ter `loading="lazy"` para melhorar o LCP e reduzir o consumo de banda inicial.

**Fontes render-blocking:** O `<link rel="stylesheet">` do Google Fonts em `index.html` (linha 10) é render-blocking. A tag `<link rel="preconnect">` está presente (positivo), mas o `display=swap` está na URL da fonte — isso é correto. O risco é a dependência de rede externa para fontes críticas. Alternativa: usar `@font-face` local ou `font-display: optional` para fontes não-críticas.

**`framer-motion` instalado mas não utilizado:** O pacote `framer-motion@12.23.22` está em `dependencies` mas nenhum componente o importa. Isso adiciona ~40KB ao bundle sem benefício. Deve ser movido para `devDependencies` ou removido.

**Re-renders por `onMouseEnter/Leave`:** Os 28 pares de handlers que mutam `e.currentTarget.style` diretamente não causam re-renders do React (pois não usam `setState`), mas são um anti-pattern que:
- Não funciona em dispositivos touch (sem hover)
- Não é acessível via teclado (`:focus` não dispara `onMouseEnter`)
- Duplica lógica que o CSS `:hover` faz nativamente

**Ausência de `Suspense`:** Não há boundaries de `Suspense` para lazy loading de componentes. Para o escopo atual (1 página), o impacto é baixo, mas ao adicionar rotas, isso se tornará crítico.

**Estimativa de bundle:** O projeto não tem build de produção analisado, mas com React 19 + Tailwind v4 (purge automático) + framer-motion não utilizado, o bundle JS estimado é ~180-220KB gzipped. Remover framer-motion reduziria ~40KB.

### 4.6 Acessibilidade e UX (WCAG 2.2)

Esta é a área de maior risco do projeto. A auditoria encontrou **zero** ocorrências de `aria-label`, `role`, `sr-only` ou `focus-visible` nos 6 componentes customizados.

**Problemas críticos:**

**a) Botões com apenas ícone sem texto acessível.** Em `Header.tsx` (linha 229-235), o botão de menu mobile usa apenas `<Menu size={20} />` ou `<X size={20} />` sem texto alternativo. Leitores de tela anunciarão "button" sem contexto. Correção: adicionar `aria-label="Abrir menu"` / `aria-label="Fechar menu"` e `aria-expanded={mobileMenuOpen}`.

**b) Botão de busca sem label.** Em `Header.tsx` (linha 147-175), o botão de busca tem `<Search size={14} />` com texto condicional `hidden lg:inline`. Em telas menores, o botão fica sem texto visível e sem `aria-label`.

**c) `<html lang>` estático.** O atributo `lang="en"` em `index.html` nunca é atualizado quando o usuário troca para PT-BR. Leitores de tela usam o `lang` para selecionar o motor de síntese de voz — um usuário PT-BR ouvirá o conteúdo com pronúncia inglesa. Correção: `useEffect(() => { document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'; }, [lang])` em `Home.tsx`.

**d) Foco não visível em botões customizados.** Todos os botões usam `border: none; outline: none` implicitamente (via `style={{}}`). O `@layer base` do Tailwind define `outline-ring/50` globalmente, mas os estilos inline sobrescrevem isso. Usuários de teclado não conseguem identificar o elemento focado.

**e) Artigos sem `<article>` semântico no Hero.** O `HeroSection.tsx` usa `<section>` como wrapper mas não usa `<article>` para o conteúdo editorial. `TrendingSection.tsx` usa `<article>` corretamente (linha 80) — inconsistência entre componentes.

**f) Imagens de gadgets sem `alt` descritivo.** Em `GadgetsSection.tsx` (linha 112), `alt={product.name}` é aceitável mas poderia ser mais descritivo (ex.: `"NexWatch Pro X1 — smartwatch premium em fundo escuro"`).

**g) `prefers-reduced-motion` ausente.** As animações `fadeInUp` (definidas em `index.css`, usadas em `HeroSection.tsx`) e os `transform: scale()` nos cards não verificam a preferência do sistema. Correção em CSS:

```css
@media (prefers-reduced-motion: reduce) {
  .fade-in-up, .fade-in-up-delay-1, .fade-in-up-delay-2, .fade-in-up-delay-3 {
    animation: none;
    opacity: 1;
  }
}
```

### 4.7 Tooling / DX / CI

| Ferramenta | Estado | Impacto |
|---|---|---|
| Prettier | ✅ Configurado (`.prettierrc`) | Formatação consistente via `pnpm format` |
| `prettier-plugin-tailwindcss` | ❌ Ausente | Classes Tailwind não são ordenadas automaticamente |
| ESLint | ❌ Ausente | Sem quality gates de código |
| `eslint-plugin-jsx-a11y` | ❌ Ausente | Problemas de acessibilidade não são detectados em CI |
| Husky + lint-staged | ❌ Ausente | Commits sem validação de qualidade |
| Vitest | ⚠️ Instalado, 0 testes | Sem cobertura de testes |
| Storybook | ❌ Ausente | Sem documentação de componentes |
| CI (GitHub Actions) | ❌ Ausente | Sem pipeline de validação |
| TypeScript check | ✅ `pnpm check` disponível | `strict: true` ativo, 0 erros TypeScript |

---

## 5. Recomendações Prioritárias

| # | Item | Impacto | Esforço | Risco | Arquivos Afetados |
|---|---|---|---|---|---|
| 1 | Corrigir `lang` dinâmico no `<html>` | **Alto** (a11y, SEO) | Baixo (5 min) | Nenhum | `Home.tsx` |
| 2 | Adicionar `aria-label` nos botões com ícone | **Alto** (WCAG 2.2) | Baixo (30 min) | Nenhum | `Header.tsx` |
| 3 | Adicionar `loading="lazy"` nas imagens fora do fold | **Alto** (LCP, banda) | Baixo (15 min) | Nenhum | `Sidebar.tsx`, `TrendingSection.tsx`, `GadgetsSection.tsx` |
| 4 | Adicionar `prefers-reduced-motion` no CSS | **Médio** (a11y) | Baixo (10 min) | Nenhum | `index.css` |
| 5 | Substituir `onMouseEnter/Leave` por CSS `:hover` | **Médio** (DX, touch) | Médio (2h) | Baixo | Todos os 6 componentes |
| 6 | Consumir tokens CSS neon via `var()` nos componentes | **Médio** (manutenção) | Médio (2h) | Baixo | Todos os 6 componentes |
| 7 | Remover `framer-motion` das `dependencies` | **Médio** (bundle ~40KB) | Baixo (5 min) | Nenhum | `package.json` |
| 8 | Extrair `CATEGORY_CONFIG` para `lib/constants.ts` | **Médio** (DRY) | Baixo (30 min) | Nenhum | `Sidebar.tsx`, `TrendingSection.tsx` |
| 9 | Adicionar `focus-visible` nos botões customizados | **Alto** (WCAG 2.2) | Médio (1h) | Baixo | Todos os 6 componentes |
| 10 | Instalar ESLint + `eslint-plugin-jsx-a11y` | **Alto** (DX, CI) | Médio (1h) | Baixo | `package.json`, novo `eslint.config.js` |
| 11 | Instalar `prettier-plugin-tailwindcss` | **Baixo** (DX) | Baixo (10 min) | Nenhum | `package.json`, `.prettierrc` |
| 12 | Adicionar Husky + lint-staged | **Médio** (quality gate) | Médio (30 min) | Baixo | `package.json` |
| 13 | Adicionar `<meta>` Open Graph | **Médio** (SEO, compartilhamento) | Baixo (15 min) | Nenhum | `index.html` |
| 14 | Extrair `CategoryBadge` e `AuthorAvatar` como componentes | **Médio** (DRY, manutenção) | Médio (1h) | Baixo | Hero, Trending, Sidebar |
| 15 | Adicionar `LanguageContext` para eliminar prop drilling | **Baixo** (escala futura) | Médio (1h) | Baixo | `App.tsx`, todos os componentes |

---

## 6. Mudanças Recomendadas por Arquivo

### `client/index.html`

```html
<!-- Adicionar após <title>: -->
<meta property="og:title" content="CTRL + ALT News — Technology Portal" />
<meta property="og:description" content="Your source for the latest in AI, Science, Robotics, and Gadgets." />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

### `client/src/pages/Home.tsx`

```tsx
// Adicionar useEffect para atualizar lang do documento:
import { useState, useEffect } from "react";

// Dentro do componente, após o useState:
useEffect(() => {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
}, [lang]);
```

### `client/src/index.css`

```css
/* Adicionar ao final do @layer base ou @layer components: */
@media (prefers-reduced-motion: reduce) {
  .fade-in-up,
  .fade-in-up-delay-1,
  .fade-in-up-delay-2,
  .fade-in-up-delay-3 {
    animation: none;
    opacity: 1;
    transform: none;
  }
  .trending-card,
  .news-card {
    transition: none;
  }
}

/* Adicionar tokens de fonte no @theme inline: */
/* --font-display: 'Bebas Neue', sans-serif; */
/* --font-body: 'Space Grotesk', sans-serif; */
/* --font-mono: 'Roboto Mono', monospace; */
```

### `client/src/components/Header.tsx`

```tsx
// Botão mobile menu — adicionar aria-label e aria-expanded:
<button
  className="md:hidden"
  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
  aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
  aria-expanded={mobileMenuOpen}
  aria-controls="mobile-menu"
  style={{ color: 'rgba(240,240,245,0.7)', background: 'none', border: 'none', padding: '4px' }}
>
  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
</button>

// Botão de busca — adicionar aria-label:
<button
  type="button"
  onClick={() => setSearchOpen(true)}
  aria-label={lang === 'en' ? "Open search" : "Abrir busca"}
  // ... restante dos props
>

// Input de busca — adicionar aria-label:
<input
  type="search"  // mudar de "text" para "search"
  aria-label={lang === 'en' ? "Search tech news" : "Buscar notícias de tecnologia"}
  // ... restante dos props
/>

// Nav — adicionar role e aria-label:
<nav
  role="navigation"
  aria-label={lang === 'en' ? "Main navigation" : "Navegação principal"}
  // ... restante dos props
>
```

### `client/src/components/HeroSection.tsx`

```tsx
// Imagem de fundo — adicionar role e aria-label:
<div
  role="img"
  aria-label="Futuristic quantum computing laboratory with AI neural networks"
  style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO_IMAGE})`, ... }}
/>

// Botão CTA — adicionar type e focus-visible:
<button
  type="button"
  className="fade-in-up fade-in-up-delay-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.78_0.18_195)]"
  // ... restante dos props
>
```

### Todos os componentes com imagens (`TrendingSection.tsx`, `Sidebar.tsx`, `GadgetsSection.tsx`)

```tsx
// Adicionar loading="lazy" em todas as imagens fora do fold:
<img
  src={article.image}
  alt={article.title[lang]}
  loading="lazy"
  // ... restante dos props
/>
```

### `client/src/lib/constants.ts` (arquivo novo)

```ts
// Extrair de Sidebar.tsx e TrendingSection.tsx:
export const CATEGORY_CONFIG = {
  AI:       { color: 'var(--color-neon-ai)',       label: 'AI',       cardClass: 'ai-card' },
  SCIENCE:  { color: 'var(--color-neon-science)',  label: 'SCIENCE',  cardClass: 'science-card' },
  ROBOTICS: { color: 'var(--color-neon-robotics)', label: 'ROBOTICS', cardClass: 'robotics-card' },
  GADGETS:  { color: 'var(--color-neon-gadgets)',  label: 'GADGETS',  cardClass: 'gadgets-card' },
} as const;
```

### `package.json` — Remoções e Adições

```json
// Remover de "dependencies" (não é usado):
// "framer-motion": "^12.23.22"

// Adicionar em "devDependencies":
// "eslint": "^9.x",
// "@eslint/js": "^9.x",
// "eslint-plugin-jsx-a11y": "^6.x",
// "eslint-plugin-react-hooks": "^5.x",
// "prettier-plugin-tailwindcss": "^0.6.x",
// "husky": "^9.x",
// "lint-staged": "^15.x"

// Adicionar em "scripts":
// "lint": "eslint client/src --ext .ts,.tsx",
// "lint:fix": "eslint client/src --ext .ts,.tsx --fix",
// "test": "vitest",
// "test:ui": "vitest --ui",
// "prepare": "husky"
```

---

## 7. Convenções Propostas do Projeto

Para manter a qualidade à medida que o projeto cresce, as seguintes convenções devem ser adotadas:

**Tokens de cor:** Sempre usar `var(--color-neon-ai)` (ou a utility Tailwind `text-neon-ai`) em vez de valores OKLCH literais. Novos valores de cor devem ser adicionados ao `@theme inline` antes de serem usados.

**Hover e interações:** Usar CSS `:hover` e `transition` em classes do `@layer components` em vez de `onMouseEnter/Leave`. Reservar handlers JS apenas para interações que requerem lógica de estado.

**Acessibilidade obrigatória:** Todo `<button>` com apenas ícone deve ter `aria-label`. Todo formulário deve ter `<label>` associado. Todo modal/dialog deve usar o componente `Dialog` do shadcn (que gerencia foco automaticamente).

**Imagens:** `alt` descritivo obrigatório. `loading="lazy"` para imagens abaixo do fold. Dimensões explícitas (`width` e `height`) para evitar CLS.

**Componentes shadcn:** Antes de criar um novo componente de UI, verificar se existe um equivalente em `components/ui/`. Customizar via `className` e CSS variables, não por cópia e modificação do arquivo.

**Nomenclatura:** Componentes em PascalCase. Hooks com prefixo `use`. Constantes em SCREAMING_SNAKE_CASE. Tipos/interfaces com prefixo `I` apenas quando necessário para distinguir de classe.

---

## 8. Checklist de Qualidade para Novas Funcionalidades

Antes de fazer merge de qualquer nova feature, verificar:

- [ ] **Tokens:** Nenhum valor OKLCH ou hex hardcoded fora de `@theme inline` ou `constants.ts`
- [ ] **Tailwind:** Classes sem conflitos, ordenadas pelo `prettier-plugin-tailwindcss`
- [ ] **A11y:** `aria-label` em ícones, `focus-visible` visível, `lang` correto, `alt` em imagens
- [ ] **Hover:** Implementado via CSS `:hover` + `transition`, não `onMouseEnter/Leave`
- [ ] **Imagens:** `loading="lazy"` se abaixo do fold, `width` e `height` definidos
- [ ] **Motion:** Animações respeitam `prefers-reduced-motion`
- [ ] **TypeScript:** `pnpm check` sem erros
- [ ] **Lint:** `pnpm lint` sem warnings
- [ ] **Testes:** Ao menos 1 teste de snapshot ou comportamento para novos componentes
- [ ] **shadcn:** Verificado se existe primitivo disponível antes de criar do zero
- [ ] **DRY:** Nenhuma lógica ou configuração duplicada entre componentes

---

## Apêndice: Comandos de Implementação Rápida (Quick Wins)

Os itens de **Esforço Baixo** da tabela de recomendações podem ser implementados em menos de 1 hora:

```bash
# 1. Instalar ferramentas de DX
pnpm add -D prettier-plugin-tailwindcss eslint @eslint/js eslint-plugin-jsx-a11y eslint-plugin-react-hooks

# 2. Remover framer-motion (não utilizado)
pnpm remove framer-motion

# 3. Instalar Husky
pnpm add -D husky lint-staged
pnpm exec husky init

# 4. Verificar TypeScript (já passa com 0 erros)
pnpm check
```

> **Nota:** Nenhuma dessas alterações afeta o layout ou o visual do portal. O backup `598e8568` está disponível para rollback caso necessário.
