/* ===========================================================
   CONFIG DO CREATOR — Nobru (Nobru × Betano)
   Mesma estrutura do Jon. Preencher: assets (logo/criador),
   links (cadastro/WhatsApp), supabase (projeto leads-nobru), favicon.
   =========================================================== */
window.BRAND = {
  id: 'nobru',
  creator: 'nobru',         // coluna `creator` no banco (influenciador)
  source: 'full',           // qual das 2 LPs: 'full' (com gate) | 'direta'

  meta: {
    title: 'Grupo VIP Nobru — Entre no grupo',
    description: 'Responda as perguntas rápidas e a equipe te direciona pro grupo. Conteúdo para maiores de 18 anos.',
    themeColor: '#FF3C00',
    favicon: './brands/nobru/assets/favicon.png'
  },

  // Meta Pixel do creator. `id` vazio = não carrega (no-op). Preencha com o
  // Pixel ID da conta de anúncio do Nobru. Vale para as 2 LPs (full + direta).
  //  - PageView dispara em toda a página (injetado no <head> pelo build).
  //  - `event` é disparado só por quem escolhe a faixa marcada com track:true
  //    e clica em "criar conta" no pop-up (fluxo direto). Ver engine.js.
  pixel: { id: '1787191679332721', event: 'CriarConta5000' },

  // Cores — identidade do NOBRU: premium DOIS TONS DE ROXO + branco;
  // verde neon SÓ em pequenos detalhes.
  tokens: {
    '--red': '#7C3AED',          // roxo vívido — acentos/ações (CTA, opção, chip)
    '--red-rgb': '124, 58, 237',
    '--red-deep': '#160a30',     // roxo profundo — fim do gradiente do hero
    '--burgundy': '#3a1a6e',
    '--dark-purple': '#160a30',
    '--yellow': '#A6F23C',       // VERDE neon — só detalhes (eyebrow, foco, badge)
    '--yellow-text': '#15082e',  // texto escuro sobre o verde
    '--white': '#ffffff',        // texto branco (hero e ações roxas)
    '--ink': '#f2eefb',          // texto claro
    '--ink-soft': '#bcb0d8',
    '--ink-faint': '#8b7fae',
    '--bg-2': '#241149',         // cards roxo escuro
    '--line': 'rgba(255, 255, 255, 0.10)',
    '--line-strong': 'rgba(255, 255, 255, 0.18)',
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
      { family: 'Betano Nichrome', src: './brands/nobru/assets/fonts/BetanoNichromeBold.woff2',
        weight: '100 900', style: 'normal', format: 'woff2' },
      { family: 'Haffer', src: './brands/nobru/assets/fonts/HafferRegular.woff2',
        weight: '400', style: 'normal', format: 'woff2' },
      { family: 'Haffer', src: './brands/nobru/assets/fonts/HafferMedium.woff2',
        weight: '500', style: 'normal', format: 'woff2' },
      { family: 'Haffer', src: './brands/nobru/assets/fonts/HafferSemiBold.woff2',
        weight: '600 700', style: 'normal', format: 'woff2' }
    ]
  },

  hero: {
    brandLogo: 'https://i.ibb.co/qMcDxty8/image.png',
    brandLogoWhite: true,     // deixa a logo branca sobre a hero laranja
    brandWordmark: 'betano',
    creatorLogo: './brands/nobru/assets/influ-logo.png', // logo do influ (fundo preto removido)
    creatorAlt: 'Nobru',
    // Influenciador (imagens finais do Nobru — WebP otimizado p/ alto tráfego):
    creatorPhoto: './brands/nobru/assets/nobru-desktop.webp', // desktop: vertical 3:4 (105KB)
    creatorBanner: './brands/nobru/assets/nobru-mobile.webp', // mobile: horizontal 16:10 (79KB)
    creatorPhotoAlt: 'Nobru',
    title: 'Grupo VIP Nobru', // mobile: nome curto no hero
    subtitleMobile: 'Responda abaixo e garanta sua vaga no grupo.',
    subtitleDesktop: 'Responda ao lado e garanta sua vaga no grupo.',
    // Headline do desktop (parte branca) — foco no influenciador.
    headlineHTML: 'Faça parte do grupo do <span class="lp-gate__hl">Nobru</span>',
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
      { id: 'nome', label: 'Nome Completo', type: 'text', autocomplete: 'name',
        placeholder: 'Seu nome completo' },
      { id: 'contato', label: 'Nome de usuário', type: 'text',
        autocomplete: 'off', placeholder: 'Seu nome de usuário',
        help: {
          link: 'Onde encontrar?',
          title: 'Onde encontrar seu nome de usuário',
          text: 'Basta acessar sua conta e clicar em <strong>Perfil</strong> — seu nome de usuário aparece ali, assim como na imagem.',
          image: './brands/nobru/assets/idbetano.png'
        } },
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
        { value: '5000_mais', label: 'R$ 5.000+', track: true, whatsapp: 'https://wa.me/5511955024776' }
      ]
    },
    consentText: 'Ao enviar, você concorda com os ',
    termsLink: 'Termos e Condições',
    cta: 'Quero entrar no grupo VIP agora'
  },

  done: {
    title: 'Tudo certo!',
    text: 'Recebemos seus dados. Em instantes você entra no Grupo VIP Nobru. Caso o redirecionamento não funcione, clique abaixo:'
  },

  seal: {
    age: '18+',
    imageUrl: '',
    text: 'Jogue com responsabilidade. O jogo pode causar dependência. Autorizado pela Portaria SPA/MF n°.246/2025'
  },

  // Barra legal obrigatória (Lei das Bets) — fixa no rodapé.
  legal: {
    age: '18+',
    msgHTML: '<strong>Ministério da Fazenda adverte:</strong> Aposta não é investimento.',
    extra: 'Autorizada pela Portaria SPA/MF nº 2.465/2025 · Jogue com responsabilidade · Consulte os T&Cs.'
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
      title: 'Falta pouco pra entrar',
      text: 'Crie sua conta na Betano, volte aqui e finalize o preenchimento para entrar no grupo.',
      cta: 'Criar conta agora'
    }
  },

  // Variantes da marca — herdam TUDO (assets, link, Supabase/DB) e mudam só
  // o necessário. Build: node build.mjs nobru direta  -> dist/nobru-direta
  variants: {
    direta: {
      flow: 'direct',                 // abre direto nas perguntas
      source: 'direta',               // distingue a origem na MESMA tabela
      meta: { title: 'Grupo VIP Nobru — Entrar no grupo (direto)' },
      // no fluxo direto, o e-mail/ID vem DEPOIS da faixa de aposta
      form: { order: ['nome', 'telefone', 'bet', 'contato'] }
    }
  },

  // ---- Integrações (preencher) ----
  links: {
    registration: 'https://kg-br.com/C.ashx?btag=a_2001773b_10037c_&affid=2000324&siteid=2001773&adid=10037&c=',   // link de cadastro da Betano
    whatsapp: 'https://sndflw.com/i/nobruforras'         // grupo de WhatsApp (destino final)
  },

  // Projeto Supabase dedicado da Betano (leads-betano) — isolamento de tráfego.
  supabase: {
    url: 'https://xmfguhdzcoybvzazhysx.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZmd1aGR6Y295YnZ6YXpoeXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzY1NTcsImV4cCI6MjA5NzMxMjU1N30.Htf3loRKvCm3Zk4fcJfE-wnIO7UPhtrHiIFbvRvyiHI',
    table: 'lp_leads'
  },

  // Espelho dos leads numa planilha do Google (Apps Script Web App). Vazio =
  // não envia. Mesma URL p/ Jon e Nobru; o recebedor separa por aba (creator).
  sheet: { url: 'https://script.google.com/macros/s/AKfycbwnxDdRpASJgFrPGXrRFiKzXYXd0su5CAaQ97Vnc84-k1Qdl_sHGcMHsiFOVgghAoWa7A/exec' }
};
