/* ===========================================================
   CONFIG DO CREATOR — Hudson (teste / piloto da centralização no Fly)
   Baseado no Jon (mesmos campos). Imagens em PLACEHOLDER por hora.
   Captação vai DIRETO pro endpoint central (3C Dashboard) — SEM Supabase.
   Preencher os TODOs (pixel, link de afiliado, WhatsApp, imagens) depois.
   =========================================================== */
window.BRAND = {
  id: 'hudson',
  creator: 'hudson',        // vai na coluna `creator` do banco central
  source: 'full',           // qual das 2 LPs: 'full' (com gate) | 'direta'

  meta: {
    title: 'Grupo VIP Hudson — Entre no grupo',
    description: 'Responda as perguntas rápidas e a equipe te direciona pro grupo. Conteúdo para maiores de 18 anos.',
    themeColor: '#FD0104',
    favicon: './brands/hudson/assets/favicon.png'
  },

  // TODO: Pixel do Hudson. `id` vazio = não carrega (no-op). Sem tracking por hora.
  pixel: { id: '', event: 'CriarConta5000' },

  // Tokens de cor — premium PRETO & DOURADO (herdado do Jon; ajustar depois).
  tokens: {
    '--red': '#c9a24b',
    '--red-rgb': '201, 162, 75',
    '--red-deep': '#0b0b0c',
    '--burgundy': '#540031',
    '--dark-purple': '#0b0b0c',
    '--ink': '#f4f0e8',
    '--ink-soft': '#b9b2a3',
    '--ink-faint': '#837d70',
    '--white': '#ffffff',
    '--bg-2': '#16161b',
    '--line': 'rgba(255, 255, 255, 0.08)',
    '--line-strong': 'rgba(201, 162, 75, 0.35)',
    '--yellow': '#c9a24b',
    '--yellow-text': '#0b0b0c'
  },

  fonts: {
    google: 'Inter:wght@400;500;600;700&family=Roboto+Flex:ital,opsz,wght@0,8..144,400..900;1,8..144,600..900',
    faces: []
  },

  hero: {
    // TODO: logo da casa do Hudson (placeholder por hora).
    brandLogo: '',
    brandLogoWhite: true,
    brandWordmark: 'superbet',
    // Imagens do influenciador — BOXES em placeholder (trocar pelas do Hudson depois).
    creatorLogo: './brands/hudson/assets/_placeholder-influencer.png',
    creatorAlt: 'Hudson',
    creatorPhoto: './brands/hudson/assets/hudson-hero.webp',   // desktop
    creatorBanner: './brands/hudson/assets/hudson-hero.webp',  // mobile (mesma imagem)
    creatorPhotoAlt: 'Hudson',
    title: 'Grupo VIP Hudson',
    subtitleMobile: 'Responda abaixo e garanta sua vaga no grupo do Hudson.',
    subtitleDesktop: 'Responda ao lado e garanta sua vaga no grupo do Hudson.',
    headlineHTML: 'Faça parte do grupo do <span class="lp-gate__hl">Hudson</span>',
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
      { id: 'email', label: 'E-mail', type: 'email', autocomplete: 'email',
        inputmode: 'email', placeholder: 'seu@email.com' },
      { id: 'contato', label: 'Nome de usuário Superbet', type: 'text',
        autocomplete: 'off', placeholder: 'Seu nome de usuário Superbet',
        noEmail: 'Aqui vai o seu nome de usuário Superbet, não o e-mail. Seu e-mail você coloca no campo E-mail acima.',
        help: {
          link: 'Onde encontrar?',
          title: 'Onde encontrar seu nome de usuário Superbet',
          text: 'Basta acessar sua conta e ir em <strong>Detalhes da conta</strong> — seu nome de usuário (@seunome) aparece ali, assim como na imagem.',
          image: './brands/hudson/assets/idsuperbet.jpg'
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
        { value: '5000_mais', label: 'R$ 5.000+', track: true, whatsapp: '' } // TODO: funil VIP do Hudson
      ]
    },
    consentText: 'Ao enviar, você concorda com os ',
    termsLink: 'Termos e Condições',
    cta: 'Quero entrar no grupo VIP agora'
  },

  done: {
    title: 'Tudo certo!',
    text: 'Recebemos seus dados. Em instantes você entra no Grupo VIP Hudson. Caso o redirecionamento não funcione, clique abaixo:'
  },

  seal: {
    age: '18+',
    imageUrl: '',
    text: 'Jogue com responsabilidade. Portaria SPA/MF Nº 2.090.'
  },

  legal: {
    age: '18+',
    msgHTML: '<strong>Ministério da Fazenda adverte:</strong> Aposta não é investimento.',
    extra: 'Autorizada pela Portaria SPA/MF nº 2.090 · Jogue com responsabilidade · Consulte os T&Cs.'
  },

  terms: [
    'Ao enviar seus dados nesta página, você declara ter no mínimo 18 anos e concorda em receber comunicações do Grupo VIP Hudson pelos contatos informados (WhatsApp, e-mail e/ou telefone).',
    'Seus dados são tratados conforme a Lei Geral de Proteção de Dados (LGPD) e utilizados para qualificação, comunicação e ações de marketing. Você pode solicitar a remoção a qualquer momento.',
    'Esta página não promete prêmios, bônus ou aumento de chance de ganho como recompensa por cadastro ou depósito. Promoções, quando existirem, são comunicadas dentro do grupo e seguem regras próprias.',
    'Conteúdo destinado a maiores de 18 anos. Aposte com responsabilidade. Este texto é um rascunho e deve passar por revisão jurídica.'
  ],

  direct: {
    noAccountLabel: 'Não possui cadastro?',
    noAccountCta: 'Cadastre-se aqui',
    popup: {
      title: 'Falta pouco pra entrar',
      text: 'Crie sua conta, volte aqui e finalize o preenchimento para entrar no grupo.',
      cta: 'Criar conta agora'
    }
  },

  variants: {
    direta: {
      flow: 'direct',
      source: 'direta',
      meta: { title: 'Grupo VIP Hudson — Entrar no grupo (direto)' },
      form: { order: ['nome', 'email', 'telefone', 'bet', 'contato'] }
    }
  },

  // ---- Integrações (TODO: preencher para ir ao ar de verdade) ----
  links: {
    registration: '',   // TODO: link de cadastro (afiliado) do Hudson
    whatsapp: ''        // TODO: grupo de WhatsApp (destino final)
  },

  // >>> Destino dos leads: DIRETO no endpoint central (3C Dashboard), sem Supabase.
  //     sendBeacon manda a `key` no corpo; o servidor faz upsert por client_id.
  //     Trocar a url pra prod (https://3cdashboard.fly.dev/ingest/leads) quando subir.
  leadsApi: {
    url: 'https://3cdashboard.fly.dev/ingest/leads',
    key: '795b76c04e7225f63ce67ac55a5fc9161f6740b59d2d6812'   // chave write-only (pública no bundle; endpoint só-upsert + rate limit)
  }

  // (sem `supabase` e sem `sheet`: o Hudson não usa o legado — só o central.)
};
