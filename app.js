/* ===========================================================
   SuperJon — LP de conversão
   Lógica: render data-driven, seleção única, progresso,
   validação do CTA e submissão abstraída (submitLead).
   =========================================================== */

(function () {
  'use strict';

  /* -----------------------------------------------------------
     Configuração das perguntas (data-driven).
     Conjunto completo de qualificação conforme a spec.
     - id:        chave usada no payload
     - text:      enunciado
     - required:  bloqueia o CTA até responder
     - qualifier: faixa de aposta marca o tier (VIP do VIP)
     - options:   { value, label, variant?: 'yellow', tier?: 'vip' }
     ----------------------------------------------------------- */
  var QUESTIONS = [
    {
      id: 'ja_aposta',
      text: 'Você já aposta?',
      required: true,
      options: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Ainda não' }
      ]
    },
    {
      id: 'preferencia',
      text: 'Você curte mais cassino ou esporte?',
      required: true,
      options: [
        { value: 'cassino', label: 'Cassino' },
        { value: 'esporte', label: 'Esporte' },
        { value: 'os_dois', label: 'Os dois', variant: 'yellow' }
      ]
    },
    {
      id: 'faixa_aposta',
      text: 'Quanto costuma apostar por mês?',
      required: true,
      qualifier: true,
      options: [
        { value: 'ate_1000', label: 'Até R$ 1.000' },
        { value: '1000_5000', label: 'R$ 1.000 a 5.000' },
        { value: 'mais_5000', label: '+ de R$ 5.000', tier: 'vip' }
      ]
    },
    {
      id: 'tem_conta',
      text: 'Já tem conta na Superbet?',
      required: true,
      options: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Não' }
      ]
    }
  ];

  /* -----------------------------------------------------------
     Destino dos dados — abstraído para plugar depois
     (Supabase / planilha / webhook da automação).
     Recebe o payload e deve resolver/rejeitar uma Promise.
     ----------------------------------------------------------- */
  async function submitLead(payload) {
    // TODO: plugar destino real. Exemplos:
    //
    //  return fetch('https://SEU-WEBHOOK', {
    //    method: 'POST',
    //    headers: { 'Content-Type': 'application/json' },
    //    body: JSON.stringify(payload)
    //  }).then(function (r) {
    //    if (!r.ok) throw new Error('Falha ao enviar lead');
    //  });
    //
    // Por enquanto apenas loga e simula sucesso.
    console.log('[submitLead] payload:', payload);
    return new Promise(function (resolve) {
      setTimeout(resolve, 600);
    });
  }

  // Link do grupo (WhatsApp/Telegram). Pode ser sobrescrito por tier.
  var GROUP_URL = '';            // ex.: 'https://chat.whatsapp.com/...'
  var GROUP_URL_VIP = '';        // ex.: grupo da fila do VIP do VIP

  /* ----------------------------- Estado ----------------------------- */
  var answers = {};              // { questionId: optionValue }

  /* --------------------------- Elementos --------------------------- */
  var container = document.getElementById('questions');
  var form = document.getElementById('leadForm');
  var cta = document.getElementById('ctaButton');
  var progressFill = document.getElementById('progressFill');
  var progressBar = document.querySelector('.lp-progress');
  var lpBody = document.querySelector('.lp-body');

  /* --------------------------- Origem / UTM --------------------------- */
  function getTracking() {
    var params = new URLSearchParams(window.location.search);
    var utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      if (params.get(k)) utm[k] = params.get(k);
    });
    return {
      utm: utm,
      referrer: document.referrer || null,
      landing_url: window.location.href
    };
  }

  /* ----------------------------- Render ----------------------------- */
  function render() {
    var frag = document.createDocumentFragment();

    QUESTIONS.forEach(function (q, idx) {
      var card = document.createElement('div');
      card.className = 'lp-q';
      card.dataset.qid = q.id;

      // Cabeçalho: número + enunciado
      var head = document.createElement('div');
      head.className = 'lp-q__head';

      var num = document.createElement('span');
      num.className = 'lp-q__num';
      num.textContent = idx + 1;

      var text = document.createElement('span');
      text.className = 'lp-q__text';
      text.textContent = q.text;

      head.appendChild(num);
      head.appendChild(text);
      card.appendChild(head);

      // Chips
      var chips = document.createElement('div');
      chips.className = 'lp-chips';

      q.options.forEach(function (opt) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip' + (opt.variant === 'yellow' ? ' chip--yellow' : '');
        chip.textContent = opt.label;
        chip.dataset.value = opt.value;
        chip.setAttribute('role', 'radio');
        chip.setAttribute('aria-checked', 'false');

        chip.addEventListener('click', function () {
          select(q, opt, chips, chip, card);
        });

        chips.appendChild(chip);
      });

      card.appendChild(chips);
      frag.appendChild(card);
    });

    container.appendChild(frag);
    updateProgress();
  }

  /* --------------------------- Seleção única --------------------------- */
  function select(question, option, chipsEl, chipEl, cardEl) {
    answers[question.id] = option.value;

    // Desmarca todos os chips da pergunta, marca o escolhido
    var siblings = chipsEl.querySelectorAll('.chip');
    siblings.forEach(function (c) {
      c.classList.remove('is-selected');
      c.setAttribute('aria-checked', 'false');
    });
    chipEl.classList.add('is-selected');
    chipEl.setAttribute('aria-checked', 'true');

    // Removeu pendência ao responder
    cardEl.classList.remove('is-pending');

    updateProgress();
  }

  /* --------------------------- Progresso --------------------------- */
  function requiredQuestions() {
    return QUESTIONS.filter(function (q) { return q.required; });
  }

  function answeredCount() {
    return requiredQuestions().filter(function (q) {
      return answers[q.id] != null;
    }).length;
  }

  function updateProgress() {
    var req = requiredQuestions().length;
    var done = answeredCount();
    var pct = req === 0 ? 100 : Math.round((done / req) * 100);
    progressFill.style.width = pct + '%';
    if (progressBar) progressBar.setAttribute('aria-valuenow', String(pct));
  }

  function isComplete() {
    return answeredCount() === requiredQuestions().length;
  }

  /* --------------------------- Payload --------------------------- */
  function buildPayload() {
    // Define tier a partir da pergunta qualificadora
    var tier = 'standard';
    QUESTIONS.forEach(function (q) {
      if (!q.qualifier) return;
      var chosen = q.options.filter(function (o) { return o.value === answers[q.id]; })[0];
      if (chosen && chosen.tier === 'vip') tier = 'vip';
    });

    var tracking = getTracking();

    return {
      answers: Object.assign({}, answers),
      tier: tier,                              // 'vip' = candidato ao VIP do VIP
      vip_candidate: tier === 'vip',
      submitted_at: new Date().toISOString(),
      source: 'lp_superjon',
      utm: tracking.utm,
      referrer: tracking.referrer,
      landing_url: tracking.landing_url,
      user_agent: navigator.userAgent
    };
  }

  /* --------------------------- Validação visual --------------------------- */
  function highlightPending() {
    var firstPending = null;
    requiredQuestions().forEach(function (q) {
      var card = container.querySelector('[data-qid="' + q.id + '"]');
      if (!card) return;
      if (answers[q.id] == null) {
        card.classList.add('is-pending');
        if (!firstPending) firstPending = card;
      } else {
        card.classList.remove('is-pending');
      }
    });
    if (firstPending) {
      firstPending.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /* --------------------------- Confirmação --------------------------- */
  function showConfirmation(payload) {
    var url = payload.tier === 'vip' && GROUP_URL_VIP ? GROUP_URL_VIP : GROUP_URL;

    // Redireciona se houver link configurado; senão, mostra tela de confirmação
    if (url) {
      window.location.href = url;
      return;
    }

    var isVip = payload.tier === 'vip';
    lpBody.innerHTML =
      '<div class="lp-done">' +
        '<div class="lp-done__check" aria-hidden="true">✓</div>' +
        (isVip
          ? '<div class="lp-done__badge">Fila VIP do VIP</div>'
          : '') +
        '<h2 class="lp-done__title">Recebemos seu cadastro</h2>' +
        '<p class="lp-done__text">A equipe vai te direcionar pro grupo certo. ' +
          'Fica de olho no contato que você usou pra acessar.</p>' +
        '<p class="lp-foot">Conteúdo para maiores de 18 anos. Jogue com responsabilidade.</p>' +
      '</div>';
  }

  /* --------------------------- Submit --------------------------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!isComplete()) {
      highlightPending();
      return;
    }

    var payload = buildPayload();

    cta.classList.add('is-loading');
    cta.disabled = true;
    cta.textContent = 'Enviando...';

    submitLead(payload)
      .then(function () {
        showConfirmation(payload);
      })
      .catch(function (err) {
        console.error('[submitLead] erro:', err);
        cta.classList.remove('is-loading');
        cta.disabled = false;
        cta.textContent = 'Tentar de novo';
      });
  });

  /* ----------------------------- Init ----------------------------- */
  render();
})();
