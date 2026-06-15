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
  var state = { hasAccount: null, data: {}, bet: null, clientId: uuid(), partialSent: false };
  var FIELDS = B.form.fields;
  var BET = B.form.bet;
  var screenEl = document.getElementById('screen');

  /* ===========================================================
     Branding: tokens, meta e hero (a partir da config)
     =========================================================== */
  function applyBranding() {
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
    btn.href = reg || '#';
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.setAttribute('role', 'button');
    btn.addEventListener('click', function (e) {
      if (!reg) { e.preventDefault(); console.warn('[create] links.registration não configurado.'); }
      state.hasAccount = 'criou_agora';
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
      });
      card.appendChild(input);
      card.dataset.field = f.id;
      form.appendChild(card);
    });

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
    form.appendChild(betCard);

    // Fluxo direto: "Não possui cadastro?" abre o pop-up de cadastro e
    // salva o lead parcial (early-save).
    if (B.flow === 'direct') {
      var D = B.direct || {};
      var na = el('label', 'lp-noacc');
      var cb = el('input', 'lp-noacc__cb');
      cb.type = 'checkbox';
      na.appendChild(cb);
      na.appendChild(el('span', 'lp-noacc__txt', D.noAccountLabel || 'Não possui cadastro?'));
      cb.addEventListener('change', function () {
        if (cb.checked) { state.hasAccount = 'nao'; sendPartial(); openReg(); }
        else { state.hasAccount = 'sim'; }
      });
      form.appendChild(na);
    }

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
  function validateField(id) {
    var v = (state.data[id] || '').trim();
    if (id === BET.id) return state.bet != null;
    if (!v) return false;
    if (id === 'contato') {
      var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      return isEmail || v.length >= 3;
    }
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
  function buildRow(opts) {
    opts = opts || {};
    var utm = getTracking();
    var bm = betMeta(state.bet);
    var tier = bm.tier === 'vip' ? 'vip' : 'standard';
    var jtc = state.hasAccount === 'sim' ? 'sim'
      : (state.hasAccount === 'nao' ? 'nao' : 'criou_agora');
    var row = {
      brand: B.brand,
      source: B.source,
      flow: B.flow || 'full',
      client_id: state.clientId,
      status: opts.partial ? 'parcial' : 'completo',
      faixa_aposta: state.bet,
      faixa_aposta_label: bm.label || '',
      tier: tier,
      vip_candidate: tier === 'vip',
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
    return row;
  }

  /* ----------------------- Submit -> Supabase ----------------------- */
  async function submitLead(row) {
    var sb = B.supabase || {};
    if (sb.url && sb.anonKey) {
      var endpoint = sb.url.replace(/\/+$/, '') + '/rest/v1/' + (sb.table || 'lp_leads');
      var res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': sb.anonKey,
          'Authorization': 'Bearer ' + sb.anonKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(row)
      });
      if (!res.ok) throw new Error('Supabase insert ' + res.status + ': ' + (await res.text()));
      return;
    }
    console.log('[submitLead] (Supabase não configurado) row:', row);
    return new Promise(function (r) { setTimeout(r, 400); });
  }

  // Salva o lead PARCIAL (fluxo direto): dispara quando a pessoa marca
  // "Não possui cadastro?" — captura o que já preencheu antes de sair pro
  // cadastro (pode não voltar). Mesmo client_id do envio final p/ casar depois.
  function sendPartial() {
    if (state.partialSent) return;
    state.partialSent = true;
    try {
      submitLead(buildRow({ partial: true })).catch(function (err) {
        console.warn('[sendPartial] falhou (segue o fluxo):', err);
      });
    } catch (e) { console.warn('[sendPartial] erro:', e); }
  }

  function handleSubmit(cta) {
    if (!requiredIds().every(validateField)) { highlightInvalid(); return; }
    var row = buildRow();
    var lbl = cta.querySelector('.lp-cta__label') || cta;
    cta.classList.add('is-loading');
    cta.disabled = true;
    lbl.textContent = 'Enviando...';
    submitLead(row)
      .then(function () { goToGroup(row); })
      .catch(function (err) {
        console.error('[submitLead] erro:', err);
        cta.classList.remove('is-loading');
        cta.disabled = false;
        lbl.textContent = 'Tentar de novo';
      });
  }

  function goToGroup(row) {
    var L = B.links || {};
    var url = (row.tier === 'vip' && L.whatsappVip) ? L.whatsappVip : L.whatsapp;
    if (url) { window.location.href = url; return; }
    renderDone(row);
  }

  /* ----------------------- TELA: done ----------------------- */
  function renderDone(row) {
    setScreen('done');
    screenEl.innerHTML = '';
    var d = B.done;
    var box = el('div', 'lp-done');
    box.appendChild(el('div', 'lp-done__check', '✓'));
    if (row.vip_candidate && d.vipBadge) box.appendChild(el('div', 'lp-done__badge', d.vipBadge));
    box.appendChild(el('h2', 'lp-done__title', d.title));
    box.appendChild(el('p', 'lp-done__text', d.text));
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
      cta.href = reg || '#';
      cta.onclick = function (e) {
        if (!reg) { e.preventDefault(); console.warn('[reg] links.registration não configurado.'); }
        sendPartial(); // garante o early-save mesmo se o change não disparou
      };
    }
    regModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeReg() { if (regModal) { regModal.hidden = true; document.body.style.overflow = ''; } }
  if (regModal) {
    regModal.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) closeReg(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !regModal.hidden) closeReg(); });
  }

  /* ----------------------- Init ----------------------- */
  applyBranding();
  paintHeroSeal();
  renderFooter();
  if (B.flow === 'direct') renderForm(false); else renderGate();
})();
