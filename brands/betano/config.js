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
    themeColor: '#FF6900',
    favicon: ''             // TODO: favicon da Betano
  },

  // Cores da Betano (laranja). Sobrescrevem os tokens do engine.
  tokens: {
    '--red': '#FF6900',
    '--red-deep': '#d35400',
    '--burgundy': '#3a2400',
    '--dark-purple': '#14110d',
    '--yellow': '#FFD400',
    '--yellow-text': '#6b5600'
  },

  hero: {
    brandLogo: '',            // TODO: logo da Betano (vazio -> wordmark)
    brandLogoWhite: true,
    brandWordmark: 'betano',
    creatorLogo: '',          // TODO: logo do criador/influencer da Betano
    creatorAlt: 'Criador',
    title: 'Betano',          // TODO: nome da campanha/LP
    subtitleMobile: 'Responda abaixo e garanta sua vaga no grupo.',
    subtitleDesktop: 'Responda ao lado e garanta sua vaga no grupo.'
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
    text: 'Jogue com responsabilidade. Portaria SPA/MF Nº 2.090.'
  },

  terms: [
    'Ao enviar seus dados nesta página, você declara ter no mínimo 18 anos e concorda em receber comunicações do grupo pelos contatos informados (WhatsApp, e-mail e/ou telefone).',
    'Seus dados são tratados conforme a LGPD e utilizados para qualificação, comunicação e ações de marketing. Você pode solicitar a remoção a qualquer momento.',
    'Esta página não promete prêmios, bônus ou aumento de chance de ganho como recompensa por cadastro ou depósito. Promoções, quando existirem, são comunicadas dentro do grupo.',
    'Conteúdo destinado a maiores de 18 anos. Aposte com responsabilidade. Texto rascunho — revisão jurídica obrigatória.'
  ],

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
