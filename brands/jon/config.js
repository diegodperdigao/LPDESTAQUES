/* ===========================================================
   CONFIG DO CREATOR — Jon (Jon Vlogs × Superbet)
   Tudo que muda por marca/criador fica AQUI. O engine é genérico.
   Para replicar: copie esta pasta (brands/<nova>/), troque os valores
   e os assets, e aponte o index.html para o novo config.js.
   =========================================================== */
window.BRAND = {
  id: 'jon',
  creator: 'jon',           // vai na coluna `creator` do banco (influenciador)
  source: 'full',           // qual das 2 LPs: 'full' (com gate) | 'direta'

  meta: {
    title: 'Grupo VIP Jon — Entre no grupo',
    description: 'Responda as perguntas rápidas e a equipe te direciona pro grupo. Conteúdo para maiores de 18 anos.',
    themeColor: '#FD0104',
    favicon: './brands/jon/assets/favicon.png'
  },

  // Tokens de cor — premium PRETO & DOURADO (tema escuro).
  tokens: {
    '--red': '#c9a24b',          // ouro — acentos/eyebrow/destaque/foco/glow
    '--red-rgb': '201, 162, 75',
    '--red-deep': '#0b0b0c',     // preto — fim do gradiente do hero
    '--burgundy': '#540031',
    '--dark-purple': '#0b0b0c',
    '--ink': '#f4f0e8',          // texto claro (sobre fundo escuro)
    '--ink-soft': '#b9b2a3',
    '--ink-faint': '#837d70',
    '--white': '#ffffff',        // texto branco no hero (superfícies viram escuras no style.css)
    '--bg-2': '#16161b',         // cards escuros
    '--line': 'rgba(255, 255, 255, 0.08)',
    '--line-strong': 'rgba(201, 162, 75, 0.35)',
    '--yellow': '#c9a24b',       // alias do ouro
    '--yellow-text': '#0b0b0c'
  },

  // Tipografia (Google Fonts). hero = Roboto Flex (bold itálico), corpo = Inter.
  fonts: {
    google: 'Inter:wght@400;500;600;700&family=Roboto+Flex:ital,opsz,wght@0,8..144,400..900;1,8..144,600..900',
    faces: []
  },

  hero: {
    brandLogo: 'https://i.ibb.co/YBhrn1zz/Superbet-Logo-svg.png',
    brandLogoWhite: true,        // aplica filtro p/ deixar a logo branca
    brandWordmark: 'superbet',   // fallback se a imagem falhar
    creatorLogo: './brands/jon/assets/jonvlogs.png',
    creatorAlt: 'Jon Vlogs',
    // Influenciador (imagens finais do Jon — WebP otimizado p/ alto tráfego):
    creatorPhoto: './brands/jon/assets/jon-desktop.webp',  // desktop: vertical 3:4 (136KB)
    creatorBanner: './brands/jon/assets/jon-mobile.webp',  // mobile: horizontal 16:10 (118KB)
    creatorPhotoAlt: 'Jon Vlogs',
    title: 'Grupo VIP Jon',
    subtitleMobile: 'Responda abaixo e garanta sua vaga no grupo do Jon Vlogs.',
    subtitleDesktop: 'Responda ao lado e garanta sua vaga no grupo do Jon Vlogs.',
    // Headline do desktop (parte branca) — foco no influenciador.
    headlineHTML: 'Faça parte do grupo do <span class="lp-gate__hl">Jon Vlogs</span>',
    subheadline: 'Acesso gratuito e direto pra quem é da comunidade. Responda abaixo e garanta sua vaga no grupo.'
  },

  gate: {
    eyebrow: 'Comece por aqui',
    questionHTML: 'Você já tem conta na <span class="lp-gate__hl">Superbet</span>?',
    sub: 'Em 1 toque a gente te leva pro caminho certo.',
    yes: 'Sim, já tenho',
    no: 'Ainda não tenho'
  },

  create: {
    eyebrow: 'Falta pouco',
    titleHTML: 'Crie sua conta na <span class="lp-gate__hl">Superbet</span>',
    sub: 'É rápido e gratuito. Assim que criar, volte aqui pra liberar seu acesso ao grupo.',
    steps: [
      'Crie sua conta na Superbet',
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
      { id: 'nome', label: 'Nome Completo', type: 'text', autocomplete: 'name',
        placeholder: 'Seu nome completo' },
      { id: 'contato', label: 'E-mail ou ID Superbet', type: 'text',
        autocomplete: 'email', placeholder: 'email@exemplo.com ou seu ID' },
      { id: 'telefone', label: 'WhatsApp', type: 'tel', autocomplete: 'tel',
        inputmode: 'tel', placeholder: '(11) 99999-9999' }
    ],
    bet: {
      id: 'faixa_aposta',
      label: 'Quanto você aposta por mês?',
      options: [
        { value: 'ate_1000', label: 'Até R$ 1.000' },
        { value: '1000_3000', label: 'R$ 1.000 a 3.000' },
        { value: '3000_5000', label: 'R$ 3.000 a 5.000' },
        { value: '5000_mais', label: 'R$ 5.000+' }
      ]
    },
    consentText: 'Ao enviar, você concorda com os ',
    termsLink: 'Termos e Condições',
    cta: 'Quero entrar no grupo VIP agora'
  },

  done: {
    title: 'Tudo certo!',
    text: 'Recebemos seus dados. Em instantes você entra no Grupo VIP Jon. Fica de olho no WhatsApp informado.'
  },

  seal: {
    age: '18+',
    imageUrl: '',   // se preenchido, usa a imagem oficial no lugar do círculo
    text: 'Jogue com responsabilidade. Portaria SPA/MF Nº 2.090.'
  },

  terms: [
    'Ao enviar seus dados nesta página, você declara ter no mínimo 18 anos e concorda em receber comunicações do Grupo VIP Jon na Superbet pelos contatos informados (WhatsApp, e-mail e/ou telefone).',
    'Seus dados são tratados conforme a Lei Geral de Proteção de Dados (LGPD) e utilizados para qualificação, comunicação e ações de marketing relacionadas à Superbet. Você pode solicitar a remoção a qualquer momento.',
    'Esta página não promete prêmios, bônus ou aumento de chance de ganho como recompensa por cadastro ou depósito. Promoções, quando existirem, são comunicadas dentro do grupo e seguem regras próprias.',
    'Conteúdo destinado a maiores de 18 anos. Aposte com responsabilidade. Este texto é um rascunho e deve passar por revisão jurídica.'
  ],

  // Fluxo direto (usado pela variante "direta"): "Não possui cadastro?" + pop-up.
  direct: {
    noAccountLabel: 'Não possui cadastro?',
    noAccountCta: 'Cadastre-se aqui',
    popup: {
      title: 'Falta pouco pra entrar',
      text: 'Crie sua conta na Superbet, volte aqui e finalize o preenchimento para entrar no grupo.',
      cta: 'Criar conta agora'
    }
  },

  // Variantes — herdam TUDO e mudam só o necessário.
  // Build: node build.mjs jon direta  -> dist/jon-direta
  variants: {
    direta: {
      flow: 'direct',
      source: 'direta',
      meta: { title: 'Grupo VIP Jon — Entrar no grupo (direto)' },
      // no fluxo direto, o e-mail/ID vem DEPOIS da faixa de aposta
      form: { order: ['nome', 'telefone', 'bet', 'contato'] }
    }
  },

  // ---- Integrações (preencher para ir ao ar) ----
  links: {
    registration: 'https://wlsuperbet.adsrv.eacdn.com/C.ashx?btag=a_46521b_431c_&affid=873&siteid=46521&adid=431&c=',      // link de cadastro da Superbet (botão "Criar conta")
    whatsapp: 'https://sndflw.com/i/superjon'           // grupo de WhatsApp (destino final)
  },

  // Destino dos leads — projeto Supabase dedicado (REST/PostgREST).
  supabase: {
    url: 'https://kjewrnbiadergwzepaoo.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZXdybmJpYWRlcmd3emVwYW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Mjc3MDMsImV4cCI6MjA5NzMwMzcwM30.o_z8NKtHRfaEs17gfDCMgwTQgUr4-vBzdJ3tZFo4Ih0',
    table: 'lp_leads'
  }
};
