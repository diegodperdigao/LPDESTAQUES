/* ===========================================================
   SuperJon — LP de conversão (Jon Vlogs × Superbet)
   Fluxo:
     gate   -> "Já tem conta na Superbet?"  (Sim / Não)
       Sim  -> form
       Não  -> create -> (abre cadastro em nova aba) -> form
     form   -> coleta dados -> submitLead -> grupo de WhatsApp
   =========================================================== */

(function () {
  'use strict';

  /* ===========================================================
     CONFIG — plugar os valores reais aqui
     =========================================================== */

  // Link de cadastro da Superbet (abre em nova aba no fluxo "Não tenho conta")
  var REGISTRATION_URL = '';            // ex.: 'https://superbet.com/...afiliado'

  // Grupo de WhatsApp (destino final do lead).
  var WHATSAPP_GROUP_URL = '';          // ex.: 'https://chat.whatsapp.com/XXXX'
  var WHATSAPP_GROUP_URL_VIP = '';      // opcional: grupo VIP (faixa 5.000+)

  // Selo +18 oficial da Superbet (imagem). Se vazio, usa placeholder estilizado.
  var SEAL_URL = '';                    // ex.: 'https://.../selo-18.png'

  // Texto do Termo de Condições exibido no modal.
  // PLACEHOLDER — substituir pelo texto jurídico oficial antes de ir ao ar.
  var TERMS_TEXT = [
    'Ao enviar seus dados nesta página, você declara ter no mínimo 18 anos e ' +
      'concorda em receber comunicações do grupo do SuperJon na Superbet pelos ' +
      'contatos informados (WhatsApp, e-mail e/ou telefone).',
    'Seus dados são tratados conforme a Lei Geral de Proteção de Dados (LGPD) e ' +
      'utilizados para qualificação, comunicação e ações de marketing relacionadas ' +
      'à Superbet. Você pode solicitar a remoção a qualquer momento.',
    'Esta página não promete prêmios, bônus ou aumento de chance de ganho como ' +
      'recompensa por cadastro ou depósito. Promoções, quando existirem, são ' +
      'comunicadas dentro do grupo e seguem regras próprias.',
    'Conteúdo destinado a maiores de 18 anos. Aposte com responsabilidade. ' +
      'Este texto é um rascunho e deve passar por revisão jurídica.'
  ];

  /* -----------------------------------------------------------
     Destino dos dados — planilha (Google Sheets via webhook).
     Recebe o payload (flat, pronto pra virar linha) e devolve Promise.
     ----------------------------------------------------------- */
  var SHEETS_WEBHOOK_URL = '';          // ex.: URL do Apps Script (doPost)

  async function submitLead(payload) {
    // Quando SHEETS_WEBHOOK_URL estiver configurado, envia pra planilha.
    // Dica: um Google Apps Script publicado como Web App (doPost) recebe o JSON
    // e dá appendRow numa planilha — simples e sem backend.
    if (SHEETS_WEBHOOK_URL) {
      return fetch(SHEETS_WEBHOOK_URL, {
        method: 'POST',
        // 'no-cors' evita bloqueio de CORS do Apps Script; resposta fica opaca.
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    // Sem destino configurado ainda: loga e simula sucesso.
    console.log('[submitLead] payload:', payload);
    return new Promise(function (resolve) { setTimeout(resolve, 500); });
  }

  /* ===========================================================
     Dados do formulário
     =========================================================== */

  // Campos de texto (cards numerados)
  var FIELDS = [
    { id: 'nome', label: 'Nome', type: 'text', autocomplete: 'name',
      placeholder: 'Seu nome completo' },
    { id: 'contato_superbet', label: 'E-mail ou ID Superbet', type: 'text',
      autocomplete: 'email', placeholder: 'email@exemplo.com ou seu ID' },
    { id: 'telefone', label: 'Telefone', type: 'tel', autocomplete: 'tel',
      inputmode: 'tel', placeholder: '(11) 99999-9999' }
  ];

  // Pergunta de faixa de aposta (chips) — qualifica o tier
  var BET = {
    id: 'faixa_aposta',
    label: 'Sobre quanto você aposta?',
    options: [
      { value: 'ate_1000', label: 'Até R$ 1.000' },
      { value: '1000_3000', label: 'R$ 1.000 a 3.000' },
      { value: '3000_5000', label: 'R$ 3.000 a 5.000' },
      { value: '5000_mais', label: 'R$ 5.000+', tier: 'vip' }
    ]
  };

  /* ===========================================================
     Estado
     =========================================================== */
  var state = {
    hasAccount: null,        // 'sim' | 'criou_agora'
    data: {},                // valores dos campos de texto
    bet: null                // valor da faixa
  };

  var screenEl = document.getElementById('screen');

  /* ===========================================================
     Tracking (origem / UTM)
     =========================================================== */
  function getTracking() {
    var params = new URLSearchParams(window.location.search);
    var utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      utm[k] = params.get(k) || '';
    });
    return utm;
  }

  /* ===========================================================
     Helpers de criação de elementos
     =========================================================== */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function cardShell(num, labelText) {
    var card = el('div', 'lp-q');
    var head = el('div', 'lp-q__head');
    if (num != null) head.appendChild(el('span', 'lp-q__num', String(num)));
    head.appendChild(el('span', 'lp-q__text', labelText));
    card.appendChild(head);
    return card;
  }

  /* ===========================================================
     TELA: gate — "Já tem conta na Superbet?"
     =========================================================== */
  function renderGate() {
    screenEl.innerHTML = '';
    state.hasAccount = null;

    var gate = el('div', 'lp-gate');
    gate.appendChild(el('span', 'lp-gate__eyebrow', 'Comece por aqui'));

    var title = el('h2', 'lp-gate__title');
    title.innerHTML = 'Você já tem conta na <span class="lp-gate__hl">Superbet</span>?';
    gate.appendChild(title);

    gate.appendChild(el('p', 'lp-gate__sub',
      'Em 1 toque a gente te leva pro caminho certo.'));

    var opts = el('div', 'lp-gate__opts');
    [
      ['sim', 'Sim, já tenho', 'lp-gate__opt--primary'],
      ['nao', 'Ainda não tenho', '']
    ].forEach(function (item) {
      var btn = el('button', 'lp-gate__opt ' + item[2]);
      btn.type = 'button';
      btn.appendChild(el('span', 'lp-gate__opt-label', item[1]));
      btn.appendChild(el('span', 'lp-gate__opt-arrow', '→'));
      btn.addEventListener('click', function () {
        if (item[0] === 'sim') {
          state.hasAccount = 'sim';
          renderForm(false);
        } else {
          renderCreate();
        }
      });
      opts.appendChild(btn);
    });
    gate.appendChild(opts);

    screenEl.appendChild(gate);
    appendFooter();
  }

  /* ===========================================================
     TELA: create — "Crie sua conta agora"
     =========================================================== */
  function renderCreate() {
    screenEl.innerHTML = '';

    screenEl.appendChild(el('p', 'lp-section-label', 'Quase lá'));

    var intro = el('p', 'lp-intro',
      'Pra entrar no grupo você precisa de uma conta na Superbet. ' +
      'Cria a sua agora — leva menos de 2 minutos.');
    screenEl.appendChild(intro);

    // Link real (não window.open): garante NOVA aba no PC, celular e
    // navegadores in-app (Instagram/WhatsApp), sem bloqueio de popup.
    var btn = el('a', 'lp-cta lp-cta--pulse', 'Crie sua conta agora');
    btn.href = REGISTRATION_URL || '#';
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.setAttribute('role', 'button');
    btn.addEventListener('click', function (e) {
      if (!REGISTRATION_URL) {
        e.preventDefault(); // sem link configurado: só transiciona (teste)
        console.warn('[create] REGISTRATION_URL não configurado.');
      }
      state.hasAccount = 'criou_agora';
      // Atraso pequeno: deixa a nova aba abrir (gesto do clique) ANTES de
      // trocar o conteúdo desta aba — senão remover o <a> cancelaria a abertura.
      setTimeout(function () { renderForm(true); }, 80);
    });
    screenEl.appendChild(btn);

    var back = el('button', 'lp-link-btn', 'Já tenho conta');
    back.type = 'button';
    back.addEventListener('click', function () {
      state.hasAccount = 'sim';
      renderForm(false);
    });
    screenEl.appendChild(back);

    appendFooter();
  }

  /* ===========================================================
     TELA: form — coleta de dados
     =========================================================== */
  function renderForm(fromCreate) {
    screenEl.innerHTML = '';

    // Barra de progresso
    var prog = el('div', 'lp-progress');
    prog.setAttribute('role', 'progressbar');
    prog.setAttribute('aria-valuemin', '0');
    prog.setAttribute('aria-valuemax', '100');
    var fill = el('div', 'lp-progress__fill');
    prog.appendChild(fill);
    screenEl.appendChild(prog);

    // Chamada (muda se veio do "criar conta")
    if (fromCreate) {
      var done = el('p', 'lp-intro lp-intro--success',
        'Agora que deu tudo certo com o cadastro, responde essas perguntas pra liberar o seu acesso:');
      screenEl.appendChild(done);
    } else {
      screenEl.appendChild(el('p', 'lp-section-label', 'Seus dados'));
    }

    var form = el('form', 'lp-form');
    form.noValidate = true;

    var n = 1;

    // Campos de texto
    FIELDS.forEach(function (f) {
      var card = cardShell(n++, f.label);
      var input = el('input', 'lp-input');
      input.type = f.type;
      input.name = f.id;
      input.placeholder = f.placeholder || '';
      if (f.autocomplete) input.autocomplete = f.autocomplete;
      if (f.inputmode) input.setAttribute('inputmode', f.inputmode);
      input.value = state.data[f.id] || '';
      input.addEventListener('input', function () {
        state.data[f.id] = input.value;
        card.classList.remove('is-pending');
        updateProgress(fill, prog);
      });
      card.appendChild(input);
      card.dataset.field = f.id;
      form.appendChild(card);
    });

    // Faixa de aposta (chips)
    var betCard = cardShell(n++, BET.label);
    betCard.dataset.field = BET.id;
    var chips = el('div', 'lp-chips');
    BET.options.forEach(function (opt) {
      var chip = el('button', 'chip', opt.label);
      chip.type = 'button';
      if (state.bet === opt.value) chip.classList.add('is-selected');
      chip.addEventListener('click', function () {
        state.bet = opt.value;
        chips.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-selected'); });
        chip.classList.add('is-selected');
        betCard.classList.remove('is-pending');
        updateProgress(fill, prog);
      });
      chips.appendChild(chip);
    });
    betCard.appendChild(chips);
    form.appendChild(betCard);

    // Consentimento
    var consent = el('p', 'lp-consent');
    consent.appendChild(document.createTextNode('Ao enviar, você concorda com os '));
    var termsLink = el('button', 'lp-terms-link', 'Termos e Condições');
    termsLink.type = 'button';
    termsLink.addEventListener('click', openTerms);
    consent.appendChild(termsLink);
    consent.appendChild(document.createTextNode('.'));
    form.appendChild(consent);

    // CTA
    var cta = el('button', 'lp-cta', 'Quero entrar no grupo agora');
    cta.type = 'submit';
    form.appendChild(cta);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleSubmit(cta);
    });

    screenEl.appendChild(form);
    appendFooter();
    updateProgress(fill, prog);
  }

  /* ===========================================================
     Validação / progresso
     =========================================================== */
  function fieldFilled(id) {
    if (id === BET.id) return state.bet != null;
    return (state.data[id] || '').trim().length > 0;
  }

  function requiredIds() {
    return FIELDS.map(function (f) { return f.id; }).concat([BET.id]);
  }

  function updateProgress(fill, prog) {
    var ids = requiredIds();
    var done = ids.filter(fieldFilled).length;
    var pct = Math.round((done / ids.length) * 100);
    fill.style.width = pct + '%';
    if (prog) prog.setAttribute('aria-valuenow', String(pct));
  }

  function validateField(id) {
    var v = (state.data[id] || '').trim();
    if (id === BET.id) return state.bet != null;
    if (!v) return false;
    if (id === 'contato_superbet') {
      // e-mail OU id: aceita e-mail válido ou texto com >= 3 chars (ID)
      var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      return isEmail || v.length >= 3;
    }
    if (id === 'telefone') {
      var digits = v.replace(/\D/g, '');
      return digits.length >= 10;
    }
    return v.length >= 2; // nome
  }

  function highlightInvalid() {
    var first = null;
    requiredIds().forEach(function (id) {
      var card = screenEl.querySelector('[data-field="' + id + '"]');
      if (!card) return;
      if (!validateField(id)) {
        card.classList.add('is-pending');
        if (!first) first = card;
      } else {
        card.classList.remove('is-pending');
      }
    });
    if (first) {
      first.classList.add('shake');
      setTimeout(function () { first.classList.remove('shake'); }, 400);
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var inp = first.querySelector('input');
      if (inp) inp.focus({ preventScroll: true });
    }
  }

  /* ===========================================================
     Payload (flat, pronto pra virar linha de planilha)
     =========================================================== */
  function betLabel(value) {
    var o = BET.options.filter(function (x) { return x.value === value; })[0];
    return o ? o.label : '';
  }

  function tierOf(value) {
    var o = BET.options.filter(function (x) { return x.value === value; })[0];
    return o && o.tier === 'vip' ? 'vip' : 'standard';
  }

  function buildPayload() {
    var utm = getTracking();
    var tier = tierOf(state.bet);
    return {
      // dados do lead
      nome: (state.data.nome || '').trim(),
      contato_superbet: (state.data.contato_superbet || '').trim(),
      telefone: (state.data.telefone || '').trim(),
      faixa_aposta: state.bet,
      faixa_aposta_label: betLabel(state.bet),
      // qualificação
      ja_tinha_conta: state.hasAccount === 'sim' ? 'sim' : 'criou_agora',
      tier: tier,
      vip_candidate: tier === 'vip',
      // consentimento
      consentimento: true,
      consentimento_texto: 'Ao enviar, você concorda com os Termos e Condições.',
      // origem
      origem: 'lp_superjon',
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_content: utm.utm_content,
      utm_term: utm.utm_term,
      referrer: document.referrer || '',
      landing_url: window.location.href,
      user_agent: navigator.userAgent,
      submitted_at: new Date().toISOString()
    };
  }

  /* ===========================================================
     Submit
     =========================================================== */
  function handleSubmit(cta) {
    var ok = requiredIds().every(validateField);
    if (!ok) {
      highlightInvalid();
      return;
    }

    var payload = buildPayload();

    cta.classList.add('is-loading');
    cta.disabled = true;
    var original = cta.textContent;
    cta.textContent = 'Enviando...';

    submitLead(payload)
      .then(function () { goToGroup(payload); })
      .catch(function (err) {
        console.error('[submitLead] erro:', err);
        cta.classList.remove('is-loading');
        cta.disabled = false;
        cta.textContent = 'Tentar de novo';
      });
  }

  function goToGroup(payload) {
    var url = (payload.tier === 'vip' && WHATSAPP_GROUP_URL_VIP)
      ? WHATSAPP_GROUP_URL_VIP
      : WHATSAPP_GROUP_URL;

    if (url) {
      window.location.href = url;
      return;
    }
    renderDone(payload);
  }

  /* ===========================================================
     TELA: done (fallback se não houver link de grupo)
     =========================================================== */
  function renderDone(payload) {
    screenEl.innerHTML = '';
    var box = el('div', 'lp-done');
    box.appendChild(el('div', 'lp-done__check', '✓'));
    if (payload.vip_candidate) {
      box.appendChild(el('div', 'lp-done__badge', 'Fila VIP'));
    }
    box.appendChild(el('h2', 'lp-done__title', 'Tudo certo!'));
    box.appendChild(el('p', 'lp-done__text',
      'Recebemos seus dados. Em instantes você entra no grupo do SuperJon. ' +
      'Fica de olho no WhatsApp informado.'));
    screenEl.appendChild(box);
    appendFooter();
  }

  /* ===========================================================
     Rodapé + selo +18
     =========================================================== */
  function appendFooter() {
    var foot = el('div', 'lp-foot');
    foot.appendChild(buildSeal());
    foot.appendChild(el('span', null,
      'Jogue com responsabilidade. Portaria SPA/MF Nº 2.090.'));
    screenEl.appendChild(foot);
  }

  // Selo +18 — círculo simples. Se SEAL_URL for definido, usa a imagem oficial.
  function buildSeal() {
    if (SEAL_URL) {
      var img = el('img', 'lp-seal-img');
      img.src = SEAL_URL;
      img.alt = '18+ Jogue com responsabilidade';
      return img;
    }
    return el('span', 'lp-seal', '18+');
  }

  // Pinta o selo do rodapé do hero (desktop)
  function paintHeroSeal() {
    document.querySelectorAll('[data-seal]').forEach(function (node) {
      node.replaceWith(buildSeal());
    });
  }

  /* ===========================================================
     Modal de Termos
     =========================================================== */
  var modal = document.getElementById('termsModal');
  var termsBody = document.getElementById('termsBody');

  function openTerms() {
    termsBody.innerHTML = '';
    TERMS_TEXT.forEach(function (p) { termsBody.appendChild(el('p', null, p)); });
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeTerms() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  modal.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-close')) closeTerms();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeTerms();
  });

  /* ===========================================================
     Init
     =========================================================== */
  /* ===========================================================
     Motion do Jon Vlogs — velocidade + fallback p/ iOS/Safari
     (que não tocam VP9 com alpha: troca o vídeo por imagem estática)
     =========================================================== */
  (function setupMotion() {
    var v = document.querySelector('video.lp-jon-motion');
    if (!v) return;
    var RATE = 0.85; // meio-termo (1 = normal)
    var apply = function () { try { v.playbackRate = RATE; } catch (e) {} };
    v.addEventListener('loadedmetadata', apply);
    v.addEventListener('playing', apply);
    apply();

    var fellBack = false;
    var fallback = function () {
      if (fellBack) return;
      fellBack = true;
      var img = document.createElement('img');
      img.className = 'lp-jon-motion';
      img.src = './assets/jonvlogs.png';
      img.alt = 'Jon Vlogs';
      v.replaceWith(img);
    };

    // Decide pela capacidade do browser, não por timeout (evita congelar
    // no desktop quando o vídeo demora a carregar do CDN).
    var canWebm = v.canPlayType &&
      v.canPlayType('video/webm; codecs="vp9"') !== '';
    if (!canWebm) {
      // iOS/Safari não tocam VP9-alpha -> imagem estática direto.
      fallback();
      return;
    }
    // Se o arquivo falhar ao carregar (404/codec), cai pra imagem.
    v.addEventListener('error', fallback, true);
    var src = v.querySelector('source');
    if (src) src.addEventListener('error', fallback);
  })();

  paintHeroSeal();
  renderGate();
})();
