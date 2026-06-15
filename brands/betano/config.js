/* ===========================================================
   CONFIG DA MARCA — Betano (SCAFFOLD)
   Mesma estrutura da SuperJon. Preencher: assets (logo/criador),
   links (cadastro/WhatsApp), supabase (projeto leads-betano), favicon.
   =========================================================== */
window.BRAND = {
  id: 'betano',
  brand: 'betano',          // coluna `brand` no banco
  source: 'lp_betano',      // coluna `source` (criador/campanha) — ajustar

  meta: {
    title: 'Betano — Entre no grupo',
    description: 'Responda as perguntas rápidas e a equipe te direciona pro grupo. Conteúdo para maiores de 18 anos.',
    themeColor: '#FF3C00',
    favicon: './brands/betano/assets/favicon.png'
  },

  // Cores da Betano: branco + laranja, texto preto. (sobrescrevem o engine)
  tokens: {
    '--red': '#FF3C00',          // laranja — primária/CTA/hero/acentos
    '--red-rgb': '255, 60, 0',   // mesmo laranja em rgb (glows com alpha)
    '--red-deep': '#e63600',     // fim do gradiente da hero
    '--burgundy': '#7a1d00',
    '--dark-purple': '#191932',  // azul tonal da marca (fundos escuros pontuais)
    '--yellow': '#FF3C00',       // sem chip amarelo na Betano: alias do laranja
    '--yellow-text': '#ffffff',
    '--white': '#FAF5F0',        // off-white da marca (fundo do corpo / casa com o divider)
    '--ink': '#141414',          // texto preto
    '--ink-soft': '#4a4a4a',
    '--ink-faint': '#8a8a8a',
    '--bg-2': '#FFFFFF',         // cards brancos (destacam no off-white)
    '--line': 'rgba(0, 0, 0, 0.12)',
    '--line-strong': 'rgba(0, 0, 0, 0.22)',
    '--font-hero': "'Betano Nichrome', system-ui, sans-serif",
    '--font-body': "'Haffer', system-ui, sans-serif",
    '--font-cta': "'Haffer', system-ui, sans-serif",   // CTAs em Haffer SemiBold
    '--cta-weight': '600',
    '--hero-style': 'normal'     // Nichrome upright (sem itálico)
  },

  // Tipografia 100% da marca: Nichrome (display) + Haffer (corpo/CTA). Sem Google.
  fonts: {
    google: '',
    faces: [
      { family: 'Betano Nichrome', src: './brands/betano/assets/fonts/BetanoNichromeBold.woff2',
        weight: '100 900', style: 'normal', format: 'woff2' },
      { family: 'Haffer', src: './brands/betano/assets/fonts/HafferRegular.woff2',
        weight: '400', style: 'normal', format: 'woff2' },
      { family: 'Haffer', src: './brands/betano/assets/fonts/HafferMedium.woff2',
        weight: '500', style: 'normal', format: 'woff2' },
      { family: 'Haffer', src: './brands/betano/assets/fonts/HafferSemiBold.woff2',
        weight: '600 700', style: 'normal', format: 'woff2' }
    ]
  },

  hero: {
    brandLogo: 'https://i.ibb.co/qMcDxty8/image.png',
    brandLogoWhite: true,     // deixa a logo branca sobre a hero laranja
    brandWordmark: 'betano',
    creatorLogo: './brands/betano/assets/influ-logo.png', // logo do influ (fundo preto removido)
    creatorAlt: 'Influenciador Betano',
    // Influenciador (PLACEHOLDERS p/ planejar — trocar pelos finais):
    creatorPhoto: './brands/betano/assets/_placeholder-influencer.png', // desktop: vertical
    creatorBanner: './brands/betano/assets/_placeholder-banner.png',    // mobile: horizontal
    creatorPhotoAlt: 'Influenciador Betano',
    title: 'Betano',          // mobile: nome curto no hero
    subtitleMobile: 'Responda abaixo e garanta sua vaga no grupo.',
    subtitleDesktop: 'Responda ao lado e garanta sua vaga no grupo.',
    // Headline do desktop (parte branca) — foco no influenciador.
    // TODO: trocar [nome do influenciador] pelo nome real.
    headlineHTML: 'Faça parte do grupo do <span class="lp-gate__hl">[nome do influenciador]</span>',
    subheadline: 'Acesso gratuito e direto pra quem é da comunidade. Responda abaixo e garanta sua vaga no grupo.'
  },

  gate: {
    eyebrow: 'Comece por aqui',
    questionHTML: 'Você já tem conta na <span class="lp-gate__hl">Betano</span>?',
    sub: 'Em 1 toque a gente te leva pro caminho certo.',
    yes: 'Sim, já tenho',
    no: 'Ainda não tenho'
  },

  create: {
    eyebrow: 'Falta pouco',
    titleHTML: 'Crie sua conta na <span class="lp-gate__hl">Betano</span>',
    sub: 'É rápido e gratuito. Assim que criar, volte aqui pra liberar seu acesso ao grupo.',
    steps: [
      'Crie sua conta na Betano',
      'Volte para esta página',
      'Responda e entre no grupo'
    ],
    cta: 'Criar conta agora',
    back: 'Já tenho conta'
  },

  form: {
    sectionLabel: 'Seus dados',
    successIntro: 'Agora que deu tudo certo com o cadastro, responde essas perguntas pra liberar o seu acesso:',
    fields: [
      { id: 'nome', label: 'Nome', type: 'text', autocomplete: 'name',
        placeholder: 'Seu nome completo' },
      { id: 'contato', label: 'E-mail ou ID Betano', type: 'text',
        autocomplete: 'email', placeholder: 'email@exemplo.com ou seu ID' },
      { id: 'telefone', label: 'Telefone', type: 'tel', autocomplete: 'tel',
        inputmode: 'tel', placeholder: '(11) 99999-9999' }
    ],
    bet: {
      id: 'faixa_aposta',
      label: 'Sobre quanto você aposta?',
      options: [
        { value: 'ate_1000', label: 'Até R$ 1.000' },
        { value: '1000_3000', label: 'R$ 1.000 a 3.000' },
        { value: '3000_5000', label: 'R$ 3.000 a 5.000' },
        { value: '5000_mais', label: 'R$ 5.000+', tier: 'vip' }
      ]
    },
    consentText: 'Ao enviar, você concorda com os ',
    termsLink: 'Termos e Condições',
    cta: 'Quero entrar no grupo agora'
  },

  done: {
    title: 'Tudo certo!',
    text: 'Recebemos seus dados. Em instantes você entra no grupo. Fica de olho no WhatsApp informado.',
    vipBadge: 'Fila VIP'
  },

  seal: {
    age: '18+',
    imageUrl: '',
    text: 'Jogue com responsabilidade. O jogo pode causar dependência. Autorizado pela Portaria SPA/MF n°.246/2025'
  },

  terms: [
    'Ao enviar seus dados nesta página, você declara ter no mínimo 18 anos e concorda em receber comunicações do grupo pelos contatos informados (WhatsApp, e-mail e/ou telefone).',
    'Seus dados são tratados conforme a LGPD e utilizados para qualificação, comunicação e ações de marketing. Você pode solicitar a remoção a qualquer momento.',
    'Esta página não promete prêmios, bônus ou aumento de chance de ganho como recompensa por cadastro ou depósito. Promoções, quando existirem, são comunicadas dentro do grupo.',
    'Conteúdo destinado a maiores de 18 anos. Aposte com responsabilidade. Texto rascunho — revisão jurídica obrigatória.'
  ],

  // Fluxo direto (usado pela variante "direta"): textos do "Não possui
  // cadastro?" e do pop-up de cadastro.
  direct: {
    noAccountLabel: 'Não possui cadastro?',
    noAccountCta: 'Cadastre-se aqui',
    popup: {
      title: 'Você ainda não tem conta?',
      text: 'Crie sua conta na Betano (abre em nova aba), volte aqui e finalize pra entrar no grupo.',
      cta: 'Clique aqui e se cadastre'
    }
  },

  // Variantes da marca — herdam TUDO (assets, link, Supabase/DB) e mudam só
  // o necessário. Build: node build.mjs betano direta  -> dist/betano-direta
  variants: {
    direta: {
      flow: 'direct',                 // abre direto nas perguntas
      source: 'lp_betano_direta',     // distingue a origem na MESMA tabela
      meta: { title: 'Betano — Entrar no grupo (direto)' }
    }
  },

  // ---- Integrações (preencher) ----
  links: {
    registration: '',   // TODO: link de cadastro da Betano
    whatsapp: '',        // TODO: grupo de WhatsApp
    whatsappVip: ''
  },

  // Projeto Supabase dedicado da Betano (leads-betano) — isolamento de tráfego.
  supabase: {
    url: '',             // TODO: URL do projeto leads-betano
    anonKey: '',         // TODO: chave anon/publishable
    table: 'lp_leads'
  }
};
