/* ===========================================================
   LP Engine — núcleo genérico (multi-marca)
   Lê a config da marca em window.BRAND (brands/<marca>/config.js).
   Fluxo: gate -> (create) -> form -> submitLead(Supabase) -> grupo.
   =========================================================== */
(function () {
  'use strict';

  var B = window.BRAND;
  if (!B) { console.error('[engine] window.BRAND não definido.'); return; }

  /* ----------------------- Helpers ----------------------- */
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

  function getTracking() {
    var params = new URLSearchParams(window.location.search);
    var utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      utm[k] = params.get(k) || '';
    });
    return utm;
  }

  /* ----------------------- Estado ----------------------- */
  function uuid() {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return 'lp-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }
  // client_id PERSISTENTE por creator: quem volta no mesmo navegador mantém o
  // mesmo id, então o recebedor casa a reentrada na mesma linha (não duplica).
  function persistentClientId() {
    var key = 'lp_cid_' + (B.creator || 'x');
    try {
      var v = localStorage.getItem(key);
      if (!v) { v = uuid(); localStorage.setItem(key, v); }
      return v;
    } catch (e) { return uuid(); } // localStorage indisponível: id de sessão
  }
  var state = { hasAccount: null, data: {}, bet: null, clientId: persistentClientId(), partialSent: false, regEventSent: false };

  // Injeta o client_id no parâmetro ?c= do link de cadastro (afiliado). A casa
  // devolve esse c= no postback S2S -> a gente casa o registro/FTD na planilha.
  function regUrlWithLead(reg) {
    if (!reg) return reg;
    var id = encodeURIComponent(state.clientId);
    if (/[?&]c=/.test(reg)) return reg.replace(/([?&]c=)[^&]*/, '$1' + id); // troca c= (mesmo vazio)
    return reg + (reg.indexOf('?') >= 0 ? '&' : '?') + 'c=' + id;
  }

  var FIELDS = B.form.fields;
  var BET = B.form.bet;
  var screenEl = document.getElementById('screen');

  /* ===========================================================
     Branding: tokens, meta e hero (a partir da config)
     =========================================================== */
  function applyBranding() {
    document.documentElement.setAttribute('data-flow', B.flow || 'full');
    if (B.meta) {
      if (B.meta.title) document.title = B.meta.title;
      setMeta('name', 'description', B.meta.description);
      setMeta('name', 'theme-color', B.meta.themeColor);
    }
    if (B.tokens) {
      var root = document.documentElement;
      Object.keys(B.tokens).forEach(function (k) { root.style.setProperty(k, B.tokens[k]); });
    }
    renderHero();
  }

  function setMeta(attr, key, val) {
    if (!val) return;
    var m = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); document.head.appendChild(m); }
    m.setAttribute('content', val);
  }

  function renderHero() {
    var h = B.hero || {};
    var logo = document.querySelector('.lp-logo-img');
    var word = document.querySelector('.lp-logo');
    var showWordmark = function () {
      if (logo) logo.style.display = 'none';
      if (word) {
        word.innerHTML = (h.brandWordmark || '') + '<span class="lp-logo__dot">.</span>';
        word.style.display = 'inline-block';
      }
    };
    if (logo) {
      if (!h.brandLogo) {
        showWordmark();              // marca sem imagem de logo -> wordmark
      } else {
        logo.src = h.brandLogo;
        logo.alt = h.brandWordmark || '';
        if (h.brandLogoWhite === false) logo.style.filter = 'none';
        logo.onerror = showWordmark; // se a imagem falhar -> wordmark
      }
    }
    var jon = document.querySelector('.lp-jon-motion');
    if (jon) {
      if (h.creatorLogo) { jon.src = h.creatorLogo; jon.alt = h.creatorAlt || ''; }
      else { jon.style.display = 'none'; }   // sem logo do criador -> não mostra img quebrada
    }

    // Influenciador: foto vertical (desktop) e banner horizontal (mobile).
    // Cada um é exibido/ocultado por breakpoint no CSS da marca.
    setHeroImg('.lp-hero__photo', h.creatorPhoto, h.creatorPhotoAlt);
    setHeroImg('.lp-hero__banner', h.creatorBanner, h.creatorPhotoAlt);

    var hfText = document.querySelector('.lp-hero__foot-text');
    if (hfText && B.seal) hfText.textContent = B.seal.text;
  }

  // define src/alt de uma imagem do influenciador; oculta se não houver src
  function setHeroImg(sel, src, alt) {
    var img = document.querySelector(sel);
    if (!img) return;
    if (src) { img.src = src; img.alt = alt || ''; }
    else { img.style.display = 'none'; }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ===========================================================
     TELA: gate
     =========================================================== */
  // marca a tela atual no <html> (data-screen) p/ o CSS reagir (ex.: banner
  // do influenciador só na tela do gate no mobile)
  function setScreen(name) {
    document.documentElement.setAttribute('data-screen', name);
  }

  function renderGate() {
    setScreen('gate');
    screenEl.innerHTML = '';
    state.hasAccount = null;
    var g = B.gate;

    var gate = el('div', 'lp-gate');
    gate.appendChild(el('span', 'lp-gate__eyebrow', g.eyebrow));
    var title = el('h2', 'lp-gate__title');
    title.innerHTML = g.questionHTML;
    gate.appendChild(title);
    gate.appendChild(el('p', 'lp-gate__sub', g.sub));

    var opts = el('div', 'lp-gate__opts');
    [['sim', g.yes, 'lp-gate__opt--primary'], ['nao', g.no, '']].forEach(function (item) {
      var btn = el('button', 'lp-gate__opt ' + item[2]);
      btn.type = 'button';
      btn.appendChild(el('span', 'lp-gate__opt-label', item[1]));
      btn.appendChild(el('span', 'lp-gate__opt-arrow', '→'));
      btn.addEventListener('click', function () {
        if (item[0] === 'sim') { state.hasAccount = 'sim'; renderForm(false); }
        else { renderCreate(); }
      });
      opts.appendChild(btn);
    });
    gate.appendChild(opts);
    screenEl.appendChild(gate);
  }

  /* ===========================================================
     TELA: create
     =========================================================== */
  function renderCreate() {
    setScreen('create');
    screenEl.innerHTML = '';
    var c = B.create;

    var wrap = el('div', 'lp-gate');
    wrap.appendChild(el('span', 'lp-gate__eyebrow', c.eyebrow));
    var title = el('h2', 'lp-gate__title');
    title.innerHTML = c.titleHTML;
    wrap.appendChild(title);
    wrap.appendChild(el('p', 'lp-gate__sub', c.sub));

    var steps = document.createElement('ol');
    steps.className = 'lp-steps';
    (c.steps || []).forEach(function (txt, i) {
      var li = document.createElement('li');
      li.appendChild(el('span', 'lp-steps__n', String(i + 1)));
      li.appendChild(el('span', null, txt));
      steps.appendChild(li);
    });
    wrap.appendChild(steps);

    // Link real -> NOVA aba garantida (PC, mobile, in-app)
    var reg = (B.links && B.links.registration) || '';
    var btn = el('a', 'lp-cta lp-cta--pulse', c.cta);
    btn.href = regUrlWithLead(reg) || '#';
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.setAttribute('role', 'button');
    btn.addEventListener('click', function (e) {
      if (!reg) { e.preventDefault(); console.warn('[create] links.registration não configurado.'); }
      state.hasAccount = 'criou_agora';
      trackCompleteRegistration(); // Meta Pixel: clicou em "criar conta agora" (cadastro novo)
      setTimeout(function () { renderForm(true); }, 80);
    });
    wrap.appendChild(btn);

    var back = el('button', 'lp-link-btn', c.back);
    back.type = 'button';
    back.addEventListener('click', function () { state.hasAccount = 'sim'; renderForm(false); });
    wrap.appendChild(back);

    screenEl.appendChild(wrap);
  }

  /* ===========================================================
     TELA: form
     =========================================================== */
  function renderForm(fromCreate) {
    setScreen('form');
    screenEl.innerHTML = '';
    var F = B.form;

    if (fromCreate) {
      screenEl.appendChild(el('p', 'lp-intro lp-intro--success', F.successIntro));
    } else {
      screenEl.appendChild(el('p', 'lp-section-label', F.sectionLabel));
    }

    var form = el('form', 'lp-form');
    form.noValidate = true;
    var n = 1;

    function fieldCard(f) {
      var card = cardShell(n++, f.label);
      // "Onde encontrar?" ao lado do label (ex.: ID) -> abre modal com o print
      if (f.help) {
        var head = card.querySelector('.lp-q__head');
        var help = el('button', 'lp-q__help');
        help.type = 'button';
        help.innerHTML = '<span class="lp-q__help-ic" aria-hidden="true">?</span>' +
          escapeHtml(f.help.link || 'Onde encontrar?');
        help.addEventListener('click', function () { openIdHelp(f.help); });
        if (head) head.appendChild(help);
      }
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
      });
      card.appendChild(input);
      // Trava anti-e-mail (opt-in): mostra um aviso em tempo real se a pessoa
      // digitar um e-mail aqui e marca o campo como pendente (bloqueia o envio).
      if (f.noEmail) {
        var warn = el('p', 'lp-input__warn');
        warn.textContent = (typeof f.noEmail === 'string') ? f.noEmail
          : 'Isso parece um e-mail. Coloque seu e-mail no campo de e-mail — aqui vai só o nome de usuário.';
        warn.hidden = true;
        card.appendChild(warn);
        input.addEventListener('input', function () {
          var bad = looksLikeEmail(input.value);
          warn.hidden = !bad;
          if (bad) card.classList.add('is-pending');
        });
      }
      card.dataset.field = f.id;
      return card;
    }

    function betCardEl() {
      var betCard = cardShell(n++, BET.label);
      betCard.dataset.field = BET.id;
      var chips = el('div', 'lp-chips');
      BET.options.forEach(function (opt) {
        var chip = el('button', 'chip', opt.label);
        chip.type = 'button';
        if (state.bet === opt.value) chip.classList.add('is-selected');
        chip.addEventListener('click', function () {
          state.bet = opt.value;
          chips.querySelectorAll('.chip').forEach(function (cc) { cc.classList.remove('is-selected'); });
          chip.classList.add('is-selected');
          betCard.classList.remove('is-pending');
        });
        chips.appendChild(chip);
      });
      betCard.appendChild(chips);
      return betCard;
    }

    // "Não possui cadastro?" (fluxo direto): callout em destaque -> pop-up + early-save
    function noAccEl() {
      var D = B.direct || {};
      var na = el('label', 'lp-noacc');
      var cb = el('input', 'lp-noacc__cb');
      cb.type = 'checkbox';
      na.appendChild(cb);
      na.appendChild(el('span', 'lp-noacc__q', D.noAccountLabel || 'Não possui cadastro?'));
      cb.addEventListener('change', function () {
        if (cb.checked) { state.hasAccount = 'nao'; sendPartial(); openReg(); }
        else { state.hasAccount = 'sim'; }
      });
      return na;
    }

    // ordem dos itens. Padrão: campos + faixa no fim. A variante direta
    // reordena via F.order (ex.: e-mail/ID depois da faixa de aposta).
    var order = (F.order && F.order.length) ? F.order
      : FIELDS.map(function (f) { return f.id; }).concat(['bet']);
    order.forEach(function (id) {
      if (id === 'bet') {
        form.appendChild(betCardEl());
      } else {
        var f = FIELDS.filter(function (x) { return x.id === id; })[0];
        if (f) form.appendChild(fieldCard(f));
      }
    });

    // Fluxo direto: "Não possui cadastro?" depois de todos os tópicos
    if (B.flow === 'direct') form.appendChild(noAccEl());

    var consent = el('p', 'lp-consent');
    consent.appendChild(document.createTextNode(F.consentText));
    var termsLink = el('button', 'lp-terms-link', F.termsLink);
    termsLink.type = 'button';
    termsLink.addEventListener('click', openTerms);
    consent.appendChild(termsLink);
    consent.appendChild(document.createTextNode('.'));
    form.appendChild(consent);

    var cta = el('button', 'lp-cta lp-cta--go');
    cta.type = 'submit';
    cta.appendChild(el('span', 'lp-cta__label', F.cta));
    form.appendChild(cta);

    form.addEventListener('submit', function (e) { e.preventDefault(); handleSubmit(cta); });

    screenEl.appendChild(form);
  }

  /* ----------------------- Validação ----------------------- */
  function requiredIds() {
    return FIELDS.map(function (f) { return f.id; }).concat([BET.id]);
  }
  // Detecta um e-mail COMPLETO (algo@dominio.tld) em qualquer parte do texto.
  // NÃO barra só por "@": um nome de usuário pode conter @ (ex.: @nobru). Só
  // acusa quando há domínio com ponto e extensão (o que caracteriza um e-mail).
  function looksLikeEmail(v) {
    return /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(String(v || ''));
  }
  function fieldById(id) {
    return FIELDS.filter(function (x) { return x.id === id; })[0];
  }
  function validateField(id) {
    var v = (state.data[id] || '').trim();
    if (id === BET.id) return state.bet != null;
    if (!v) return false;
    // Trava anti-e-mail (opt-in via `noEmail` no config do campo): impede digitar
    // o e-mail onde vai o nome de usuário. Só afeta marcas que marcarem a flag —
    // o Jon, cujo `contato` é "E-mail ou ID Superbet", continua aceitando e-mail.
    var fc = fieldById(id);
    if (fc && fc.noEmail && looksLikeEmail(v)) return false;
    if (id === 'contato') {
      return looksLikeEmail(v) || v.length >= 3;
    }
    if (id === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (id === 'telefone') return v.replace(/\D/g, '').length >= 10;
    return v.length >= 2;
  }
  function highlightInvalid() {
    var first = null;
    requiredIds().forEach(function (id) {
      var card = screenEl.querySelector('[data-field="' + id + '"]');
      if (!card) return;
      if (!validateField(id)) { card.classList.add('is-pending'); if (!first) first = card; }
      else card.classList.remove('is-pending');
    });
    if (first) {
      first.classList.add('shake');
      setTimeout(function () { first.classList.remove('shake'); }, 400);
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var inp = first.querySelector('input');
      if (inp) inp.focus({ preventScroll: true });
    }
  }

  /* ----------------------- Payload (linha do banco) ----------------------- */
  function betMeta(value) {
    return BET.options.filter(function (x) { return x.value === value; })[0] || {};
  }

  // Dispara o evento de conversão no Meta Pixel — SÓ p/ a faixa marcada com
  // `track: true` na config (ex.: R$ 5.000+). No-op se o Pixel não carregou
  // (id vazio) ou se a faixa selecionada não é a rastreada.
  function trackPixelConversion() {
    var opt = betMeta(state.bet);
    if (!opt || !opt.track) return;
    var evt = (B.pixel && B.pixel.event) || 'CriarConta5000';
    // event_id p/ deduplicar navegador <-> servidor (CAPI). Setado ANTES do check
    // do fbq: se o Pixel estiver bloqueado (adblock/iOS), o CAPI ainda entrega.
    state.capi = { event: evt, event_id: state.clientId + '-c5k' };
    if (typeof window.fbq !== 'function') return;
    try {
      window.fbq('trackCustom', evt, {
        creator: B.creator,
        source: B.source,
        faixa_aposta: state.bet
      }, { eventID: state.capi.event_id });
    } catch (e) { /* pixel indisponível: nunca bloqueia o fluxo */ }
  }

  // Evento PADRÃO "CompleteRegistration" do Meta — dispara quando o lead
  // completa e envia o formulário da LP. Vale p/ todas as marcas e fluxos,
  // SEM trava de faixa (independente do valor escolhido). Independente do
  // CriarConta5000. No-op se o Pixel não carregou (id vazio).
  function trackCompleteRegistration() {
    if (state.regEventSent) return;              // dispara no máx. 1x por sessão
    if (typeof window.fbq !== 'function') return;
    state.regEventSent = true;
    try {
      window.fbq('track', 'CompleteRegistration', {
        creator: B.creator,
        source: B.source,
        flow: B.flow || 'full',
        faixa_aposta: state.bet
      });
    } catch (e) { /* pixel indisponível: nunca bloqueia o fluxo */ }
  }

  // lê um cookie (ex.: _fbp / _fbc do Meta) p/ melhorar o match do CAPI.
  function getCookie(name) {
    var m = ('; ' + document.cookie).split('; ' + name + '=');
    return m.length === 2 ? decodeURIComponent(m.pop().split(';').shift()) : '';
  }

  function buildRow(opts) {
    opts = opts || {};
    var utm = getTracking();
    var bm = betMeta(state.bet);
    var jtc = state.hasAccount === 'sim' ? 'sim'
      : (state.hasAccount === 'nao' ? 'nao' : 'criou_agora');
    var row = {
      creator: B.creator,
      source: B.source,
      flow: B.flow || 'full',
      client_id: state.clientId,
      status: opts.partial ? 'parcial' : 'completo',
      faixa_aposta: state.bet,
      faixa_aposta_label: bm.label || '',
      ja_tinha_conta: jtc,
      consentimento: !opts.partial,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_content: utm.utm_content,
      utm_term: utm.utm_term,
      referrer: document.referrer || '',
      landing_url: window.location.href,
      user_agent: navigator.userAgent
    };
    FIELDS.forEach(function (f) { row[f.id] = (state.data[f.id] || '').trim(); });
    // dados só p/ o CAPI (server-side): lidos pelo Apps Script, ignorados pela
    // planilha e REMOVIDOS antes do Supabase (ver postLead) p/ não estourar 400.
    row.fbp = getCookie('_fbp');
    row.fbc = getCookie('_fbc');
    if (state.capi) { row.capi_event = state.capi.event; row.capi_event_id = state.capi.event_id; }
    return row;
  }

  /* ----------------------- Submit -> Supabase (robusto) ----------------------- */
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function leadEndpoint() {
    var sb = B.supabase || {};
    if (!sb.url || !sb.anonKey) return null;
    return {
      url: sb.url.replace(/\/+$/, '') + '/rest/v1/' + (sb.table || 'lp_leads'),
      key: sb.anonKey
    };
  }

  // Espelha o lead numa planilha do Google (Apps Script Web App) — destino que
  // o time controla, além do Supabase. Best-effort: sendBeacon sobrevive ao
  // redirect pro WhatsApp e não trava a conversão. No-op se B.sheet.url vazio.
  function postToSheet(row) {
    var url = B.sheet && B.sheet.url;
    if (!url) return;
    try {
      var body = JSON.stringify(row);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
      } else {
        fetch(url, {
          method: 'POST', mode: 'no-cors', keepalive: true,
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: body
        });
      }
    } catch (e) { /* best-effort: nunca bloqueia o fluxo */ }
  }

  // Espelha o lead pro endpoint central de ingest (3C Dashboard). Aditivo e
  // best-effort — no-op se B.leadsApi.url vazio (Jon/Nobru não têm ainda, seguem
  // só no Supabase/planilha). sendBeacon manda a chave NO CORPO (não dá header
  // custom) e usa text/plain -> sem preflight CORS. O servidor faz upsert por
  // client_id ("só melhora"). Nunca bloqueia a conversão.
  function postToCentral(row) {
    var api = B.leadsApi;
    if (!api || !api.url) return;
    try {
      var payload = api.key ? Object.assign({ key: api.key }, row) : row;
      var body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(api.url, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
      } else {
        fetch(api.url, {
          method: 'POST', mode: 'no-cors', keepalive: true,
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: body
        });
      }
    } catch (e) { /* best-effort: nunca bloqueia o fluxo */ }
  }

  // 1 POST. keepalive=true deixa o insert completar mesmo durante o redirect
  // pro WhatsApp (senão a navegação cancela a requisição).
  async function postLead(row) {
    var ep = leadEndpoint();
    if (!ep) { console.log('[submitLead] (Supabase não configurado) row:', row); await wait(120); return; }
    // `email` é campo só do Nobru e ainda não existe no schema legado do Supabase;
    // remove do payload p/ não estourar 400 (PostgREST rejeita coluna inexistente).
    // A planilha recebe o email cheio via postToSheet. Some daqui quando migrarmos o banco.
    // remove campos que NÃO existem no schema do Supabase (email + os do CAPI).
    // Eles vão só pra planilha via postToSheet; o Supabase rejeitaria (400).
    var payload = row, SB_STRIP = ['email', 'fbp', 'fbc', 'capi_event', 'capi_event_id'];
    if (SB_STRIP.some(function (k) { return Object.prototype.hasOwnProperty.call(row, k); })) {
      payload = Object.assign({}, row);
      SB_STRIP.forEach(function (k) { delete payload[k]; });
    }
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var to = ctrl ? setTimeout(function () { ctrl.abort(); }, 6000) : null;
    try {
      var res = await fetch(ep.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ep.key,
          'Authorization': 'Bearer ' + ep.key,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload),
        keepalive: true,
        signal: ctrl ? ctrl.signal : undefined
      });
      if (!res.ok) throw new Error('Supabase insert ' + res.status + ': ' + (await res.text()));
    } finally { if (to) clearTimeout(to); }
  }

  // tenta com backoff (rede instável / pico de tráfego)
  async function submitLead(row) {
    var delays = [0, 700, 1800];
    var lastErr;
    for (var i = 0; i < delays.length; i++) {
      if (delays[i]) await wait(delays[i]);
      try { await postLead(row); return; }
      catch (e) { lastErr = e; }
    }
    throw lastErr;
  }

  // Fila local (à prova de falha): se o banco falhar mesmo após os retries,
  // o lead não se perde — fica salvo e é reenviado na próxima visita.
  var QUEUE_KEY = 'lp_lead_queue';
  function queueLead(row) {
    try {
      var q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      q.push(row);
      if (q.length > 80) q = q.slice(-80);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    } catch (e) { /* localStorage indisponível: ok, segue */ }
  }
  function flushQueue() {
    if (!leadEndpoint()) return;
    var q;
    try { q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch (e) { return; }
    if (!q.length) return;
    var remaining = [];
    (function next(i) {
      if (i >= q.length) {
        try { localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining)); } catch (e) {}
        return;
      }
      postLead(q[i]).then(function () { next(i + 1); })
        .catch(function () { remaining.push(q[i]); next(i + 1); });
    })(0);
  }

  // Salva o lead PARCIAL (fluxo direto): dispara quando a pessoa marca
  // "Não possui cadastro?" — captura o que já preencheu antes de sair pro
  // cadastro (pode não voltar). Mesmo client_id do envio final p/ casar depois.
  // Gatilho do CAPI: reposta o lead (com capi_event_id) pra planilha no MESMO
  // instante do pixel "criar conta". Só planilha — não toca facebook.com, então
  // não sofre adblock/iOS. O Receiver casa por client_id e dispara o CAPI com o
  // MESMO event_id -> o Meta deduplica com o Pixel do navegador (sem contar 2x).
  function postCapiTrigger() {
    if (!state.capi) return;
    try { var r = buildRow({ partial: true }); postToSheet(r); postToCentral(r); } catch (e) { /* best-effort */ }
  }

  function sendPartial() {
    if (state.partialSent) return;
    state.partialSent = true;
    var row = buildRow({ partial: true });
    postToSheet(row); // espelha na planilha do time
    postToCentral(row); // + endpoint central (Fly) se configurado
    try {
      submitLead(row).catch(function (err) {
        console.warn('[sendPartial] falhou — enfileirando:', err);
        queueLead(row);
      });
    } catch (e) { console.warn('[sendPartial] erro:', e); queueLead(row); }
  }

  function handleSubmit(cta) {
    if (!requiredIds().every(validateField)) { highlightInvalid(); return; }
    // NÃO dispara CompleteRegistration aqui: entrar no grupo (form submit) NÃO é
    // criar conta. O evento sai só de quem clica em "criar conta agora".
    var row = buildRow();
    postToSheet(row); // espelha na planilha do time (independe do pixel)
    postToCentral(row); // + endpoint central (Fly) se configurado
    var lbl = cta.querySelector('.lp-cta__label') || cta;
    cta.classList.add('is-loading');
    cta.disabled = true;
    lbl.textContent = 'Enviando...';
    var moved = false;
    function go() { if (moved) return; moved = true; goToGroup(row); }
    submitLead(row)
      .then(go)
      .catch(function (err) {
        // não perde o lead (fila local) e não trava a conversão (segue pro grupo)
        console.error('[submitLead] erro após retries — enfileirando:', err);
        queueLead(row);
        go();
      });
    // Trava de segurança: NUNCA deixa o usuário preso em "Enviando...".
    // O insert continua em background (keepalive) e fica na fila como backup.
    setTimeout(function () { if (!moved) { queueLead(row); go(); } }, 4000);
  }

  function goToGroup(row) {
    var L = B.links || {};
    // Destino por faixa: se a opção escolhida tem seu próprio whatsapp (ex.:
    // 5.000+ -> agente VIP), usa ele; senão, cai no grupo padrão da marca.
    var bm = betMeta(state.bet) || {};
    var url = bm.whatsapp || L.whatsapp || '';
    // Sempre renderiza a tela final (com botão) — assim o usuário nunca trava
    // em "Enviando..." mesmo se o redirect automático demorar/for bloqueado.
    renderDone(row, url);
    if (url) { try { window.location.assign(url); } catch (e) {} }
  }

  /* ----------------------- TELA: done ----------------------- */
  function renderDone(row, url) {
    setScreen('done');
    screenEl.innerHTML = '';
    var d = B.done;
    var box = el('div', 'lp-done');
    box.appendChild(el('div', 'lp-done__check', '✓'));
    box.appendChild(el('h2', 'lp-done__title', d.title));
    box.appendChild(el('p', 'lp-done__text', d.text));
    if (url) {
      var goBtn = el('a', 'lp-cta lp-done__cta', (d && d.cta) || 'Entrar no grupo');
      goBtn.href = url;
      goBtn.rel = 'noopener noreferrer';
      box.appendChild(goBtn);
    }
    screenEl.appendChild(box);
  }

  /* ----------------------- Rodapé / selo ----------------------- */
  function renderFooter() {
    var foot = document.getElementById('lpFoot');
    if (!foot) return;
    foot.innerHTML = '';
    foot.appendChild(buildSeal());
    foot.appendChild(el('span', null, B.seal.text));
  }

  // Barra legal obrigatória (Lei das Bets) — preenche o texto a partir de B.legal.
  function renderLegalBar() {
    var bar = document.getElementById('lpLegal');
    var L = B.legal;
    if (!bar) return;
    if (!L) { bar.style.display = 'none'; return; }  // marca sem config -> não mostra
    var badge = bar.querySelector('.lp-legal__18');
    var msg = bar.querySelector('.lp-legal__msg');
    var extra = bar.querySelector('.lp-legal__extra');
    if (badge) badge.textContent = L.age || '18+';
    if (msg) msg.innerHTML = L.msgHTML || '';
    if (extra) extra.textContent = L.extra || '';
    // a barra legal substitui os selos/textos antigos (footer do corpo + selo do hero)
    var foot = document.getElementById('lpFoot');
    if (foot) foot.style.display = 'none';
    var heroFoot = document.querySelector('.lp-hero__foot');
    if (heroFoot) heroFoot.style.display = 'none';
  }
  function buildSeal() {
    if (B.seal && B.seal.imageUrl) {
      var img = el('img', 'lp-seal-img');
      img.src = B.seal.imageUrl;
      img.alt = (B.seal.age || '18+') + ' Jogue com responsabilidade';
      return img;
    }
    return el('span', 'lp-seal', (B.seal && B.seal.age) || '18+');
  }
  function paintHeroSeal() {
    document.querySelectorAll('[data-seal]').forEach(function (node) { node.replaceWith(buildSeal()); });
  }

  /* ----------------------- Modal de Termos ----------------------- */
  var modal = document.getElementById('termsModal');
  var termsBody = document.getElementById('termsBody');
  function openTerms() {
    termsBody.innerHTML = '';
    (B.terms || []).forEach(function (p) { termsBody.appendChild(el('p', null, p)); });
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeTerms() { modal.hidden = true; document.body.style.overflow = ''; }
  if (modal) {
    modal.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) closeTerms(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeTerms(); });
  }

  /* ----------------------- Pop-up de cadastro (fluxo direto) ----------------------- */
  var regModal = document.getElementById('regModal');
  function openReg() {
    if (!regModal) return;
    var D = (B.direct && B.direct.popup) || {};
    var reg = (B.links && B.links.registration) || '';
    var t = regModal.querySelector('#regTitle');
    var x = regModal.querySelector('#regText');
    var cta = regModal.querySelector('#regCta');
    if (t) t.textContent = D.title || 'Crie sua conta';
    if (x) x.textContent = D.text || '';
    if (cta) {
      cta.textContent = D.cta || 'Clique aqui e se cadastre';
      cta.href = regUrlWithLead(reg) || '#';
      cta.onclick = function (e) {
        if (!reg) { e.preventDefault(); console.warn('[reg] links.registration não configurado.'); }
        trackCompleteRegistration(); // Meta Pixel: também conta como registro completo (sem trava de faixa)
        trackPixelConversion(); // Meta Pixel: só dispara p/ a faixa 5.000+ (track:true)
        postCapiTrigger(); // espelho server-side (CAPI) do CriarConta5000, deduplicado
        sendPartial(); // garante o early-save mesmo se o change não disparou
      };
    }
    regModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeReg() {
    if (regModal) { regModal.hidden = true; document.body.style.overflow = ''; }
    // fechar o pop-up volta a checkbox p/ desmarcada (ela é só o gatilho)
    var cb = document.querySelector('.lp-noacc__cb');
    if (cb) cb.checked = false;
    state.hasAccount = 'sim';
  }
  if (regModal) {
    regModal.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) closeReg(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !regModal.hidden) closeReg(); });
  }

  /* ----------------------- Modal "Onde encontrar o ID" ----------------------- */
  var idHelpModal = document.getElementById('idHelpModal');
  function openIdHelp(help) {
    if (!idHelpModal || !help) return;
    var t = idHelpModal.querySelector('#idHelpTitle');
    var x = idHelpModal.querySelector('#idHelpText');
    var img = idHelpModal.querySelector('#idHelpImg');
    if (t) t.textContent = help.title || 'Onde encontrar seu ID';
    if (x) x.innerHTML = help.text || '';
    if (img) { img.src = help.image || ''; img.alt = help.title || ''; img.style.display = help.image ? '' : 'none'; }
    idHelpModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeIdHelp() { if (idHelpModal) { idHelpModal.hidden = true; document.body.style.overflow = ''; } }
  if (idHelpModal) {
    idHelpModal.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) closeIdHelp(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !idHelpModal.hidden) closeIdHelp(); });
  }

  /* ----------------------- Init ----------------------- */
  applyBranding();
  paintHeroSeal();
  renderFooter();
  renderLegalBar();
  flushQueue(); // reenvia leads que ficaram pendentes em visitas anteriores
  if (B.flow === 'direct') { state.hasAccount = 'sim'; renderForm(false); }
  else renderGate();
})();
