/* ===========================================================
   CONFIG DA MARCA — SuperJon (Jon Vlogs × Superbet)
   Tudo que muda por marca/criador fica AQUI. O engine é genérico.
   Para replicar: copie esta pasta (brands/<nova>/), troque os valores
   e os assets, e aponte o index.html para o novo config.js.
   =========================================================== */
window.BRAND = {
  id: 'superjon',
  brand: 'superbet',        // vai na coluna `brand` do banco
  source: 'lp_superjon',    // vai na coluna `source` (criador/campanha)

  meta: {
    title: 'SuperJon — Entre no grupo',
    description: 'Responda as perguntas rápidas e a equipe te direciona pro grupo. Conteúdo para maiores de 18 anos.',
    themeColor: '#FD0104',
    favicon: 'https://play-lh.googleusercontent.com/Q6uqNf1b4k7h4peN2r7jX1ok-Ur5l28cjm9qUb02Te2fyvo7iQRI09ReCZOQM26FSw=s256-c'
  },

  // Tokens de cor (sobrescrevem os defaults do engine.css em :root)
  tokens: {
    '--red': '#FD0104',
    '--red-deep': '#d10003',
    '--burgundy': '#540031',
    '--dark-purple': '#181020',
    '--yellow': '#FFE200',
    '--yellow-text': '#7a5c00'
  },

  hero: {
    brandLogo: 'https://i.ibb.co/YBhrn1zz/Superbet-Logo-svg.png',
    brandLogoWhite: true,        // aplica filtro p/ deixar a logo branca
    brandWordmark: 'superbet',   // fallback se a imagem falhar
    creatorLogo: './brands/superjon/assets/jonvlogs.png',
    creatorAlt: 'Jon Vlogs',
    title: 'SuperJon',
    subtitleMobile: 'Responda abaixo e garanta sua vaga no grupo do Jon Vlogs.',
    subtitleDesktop: 'Responda ao lado e garanta sua vaga no grupo do Jon Vlogs.'
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
      { id: 'nome', label: 'Nome', type: 'text', autocomplete: 'name',
        placeholder: 'Seu nome completo' },
      { id: 'contato', label: 'E-mail ou ID Superbet', type: 'text',
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
    text: 'Recebemos seus dados. Em instantes você entra no grupo do SuperJon. Fica de olho no WhatsApp informado.',
    vipBadge: 'Fila VIP'
  },

  seal: {
    age: '18+',
    imageUrl: '',   // se preenchido, usa a imagem oficial no lugar do círculo
    text: 'Jogue com responsabilidade. Portaria SPA/MF Nº 2.090.'
  },

  terms: [
    'Ao enviar seus dados nesta página, você declara ter no mínimo 18 anos e concorda em receber comunicações do grupo do SuperJon na Superbet pelos contatos informados (WhatsApp, e-mail e/ou telefone).',
    'Seus dados são tratados conforme a Lei Geral de Proteção de Dados (LGPD) e utilizados para qualificação, comunicação e ações de marketing relacionadas à Superbet. Você pode solicitar a remoção a qualquer momento.',
    'Esta página não promete prêmios, bônus ou aumento de chance de ganho como recompensa por cadastro ou depósito. Promoções, quando existirem, são comunicadas dentro do grupo e seguem regras próprias.',
    'Conteúdo destinado a maiores de 18 anos. Aposte com responsabilidade. Este texto é um rascunho e deve passar por revisão jurídica.'
  ],

  // ---- Integrações (preencher para ir ao ar) ----
  links: {
    registration: '',      // link de cadastro da Superbet (botão "Criar conta")
    whatsapp: '',          // grupo de WhatsApp (destino final)
    whatsappVip: ''        // opcional: grupo VIP (faixa 5.000+)
  },

  // Destino dos leads — projeto Supabase dedicado (REST/PostgREST).
  supabase: {
    url: '',               // ex.: https://xxxx.supabase.co
    anonKey: '',           // chave publishable/anon (pode ser pública)
    table: 'lp_leads'
  }
};
