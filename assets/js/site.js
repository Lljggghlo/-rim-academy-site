/* =========================================================
   RIM Academy — script unique
   1. Réglages (le SEUL bloc à modifier)
   2. Outils
   3. UTM
   4. Cookies + GA4 + Meta Pixel
   5. Accès à la vidéo (opt-in)
   6. Page vidéo (VSL)
   7. Questionnaire + calendrier Calendly
   8. Vidéos témoignages
   9. Divers (anciens liens, page merci, mandat)
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 1. RÉGLAGES ---------- */
  var CFG = {
    // Adresse qui reçoit les demandes (FormSubmit, déjà activé sur ton ancien site).
    formEndpoint: 'https://formsubmit.co/ajax/rim.conciergerie@gmail.com',

    // Identifiant YouTube de la VSL. Vide : version sans vidéo.
    youtubeId: '',

    // Lien de ton événement Calendly, ex. https://calendly.com/rim-academy/appel-decouverte
    // Tant qu'il est vide, le calendrier ne s'affiche pas.
    calendlyUrl: 'https://calendly.com/rim-conciergerie/appel-decouverte-rim-academy',

    // Mesure d'audience et publicité (laisser vide = désactivé).
    ga4Id: '',        // ex. G-ABC123XYZ
    metaPixelId: '',  // ex. 123456789012345

    // Réponses qui ferment l'accès au calendrier.
    disqualify: {
      heures: ['moins-5h'],
      quand: ['sans-date'],
      budget: ['moins-1000'],
      engagement: ['non']
    },

    // Durée de validité du choix cookies (jours).
    consentDays: 180
  };

  /* ---------- 2. OUTILS ---------- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = {
    get: function (area, k) { try { var v = window[area].getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set: function (area, k, v) { try { window[area].setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (area, k) { try { window[area].removeItem(k); } catch (e) {} }
  };
  var page = document.body.getAttribute('data-page') || '';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function loadScript(src, attrs) {
    var s = document.createElement('script');
    s.src = src; s.async = true;
    if (attrs) Object.keys(attrs).forEach(function (a) { s.setAttribute(a, attrs[a]); });
    document.head.appendChild(s);
    return s;
  }
  function post(data) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
    return fetch(CFG.formEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { clearTimeout(t); return r.ok; })
      .catch(function () { clearTimeout(t); return false; });
  }
  function busy(btn, on, label) {
    if (!btn) return;
    if (on) {
      btn.dataset.label = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>' + (label || 'Un instant') + '</span>';
    } else {
      btn.disabled = false;
      if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
    }
  }

  /* ---------- 3. UTM ---------- */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'fbclid', 'gclid'];
  (function captureUtm() {
    var q = new URLSearchParams(location.search), found = {}, any = false;
    UTM_KEYS.forEach(function (k) { if (q.get(k)) { found[k] = q.get(k).slice(0, 200); any = true; } });
    if (any) store.set('sessionStorage', 'ra_utm', found);
  })();
  function utm() { return store.get('sessionStorage', 'ra_utm') || {}; }

  /* ---------- 4. COOKIES + MESURE ---------- */
  var consent = null;
  function readConsent() {
    var c = store.get('localStorage', 'ra_consent');
    if (!c || !c.t || (Date.now() - c.t) > CFG.consentDays * 864e5) return null;
    return c;
  }
  function saveConsent(analytics, ads) {
    consent = { analytics: !!analytics, ads: !!ads, t: Date.now() };
    store.set('localStorage', 'ra_consent', consent);
    applyConsent();
    var b = $('#cookie'); if (b) b.hidden = true;
  }
  function applyConsent() {
    if (!consent) return;
    if (consent.analytics && CFG.ga4Id && !window.gtag) {
      loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CFG.ga4Id));
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', CFG.ga4Id);
    }
    if (consent.ads && CFG.metaPixelId && !window.fbq) {
      /* Code Meta Pixel officiel */
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', CFG.metaPixelId);
      window.fbq('track', 'PageView');
    }
  }
  // name : nom GA4 ; meta : [type, nom] pour Meta
  function track(name, params, meta) {
    if (window.gtag && consent && consent.analytics) window.gtag('event', name, params || {});
    if (window.fbq && consent && consent.ads && meta) window.fbq(meta[0], meta[1], params || {});
  }
  function initCookies() {
    consent = readConsent();
    var banner = $('#cookie');
    if (!banner) return;
    var trackers = !!(CFG.ga4Id || CFG.metaPixelId);
    // Aucun traceur configuré : pas de bandeau (rien à consentir).
    if (consent) applyConsent(); else if (trackers) banner.hidden = false;
    $('#ck-refuse') && $('#ck-refuse').addEventListener('click', function () { saveConsent(false, false); });
    $('#ck-accept') && $('#ck-accept').addEventListener('click', function () { saveConsent(true, true); });
    $('#ck-custom') && $('#ck-custom').addEventListener('click', function () {
      var p = $('#ck-prefs'); if (!p) return;
      p.hidden = !p.hidden;
      $('#ck-save').hidden = p.hidden;
    });
    $('#ck-save') && $('#ck-save').addEventListener('click', function () {
      saveConsent($('#ck-analytics').checked, $('#ck-ads').checked);
    });
    $$('[data-cookie-open]').forEach(function (el) {
      el.addEventListener('click', function () {
        banner.hidden = false;
        if (consent) { $('#ck-analytics').checked = consent.analytics; $('#ck-ads').checked = consent.ads; }
      });
    });
  }

  /* ---------- 5. ACCÈS À LA VIDÉO (OPT-IN) ---------- */
  function hasAccess() {
    var a = store.get('localStorage', 'ra_access');
    return !!(a && a.t && (Date.now() - a.t) < 365 * 864e5);
  }
  function lead() { return store.get('sessionStorage', 'ra_lead') || {}; }

  function normPhone(code, raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.indexOf('00') === 0) return '+' + d.slice(2);
    if (code && code !== 'autre') { d = d.replace(/^0+/, ''); return code + d; }
    return '+' + d;
  }
  function setErr(form, name, msg) {
    var input = form.elements[name], box = $('[data-err="' + name + '"]', form);
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (box) box.textContent = msg || '';
  }

  function initOptin() {
    var dlg = $('#optin');
    // Visiteur qui a déjà l'accès : les boutons mènent directement au calendrier.
    if (hasAccess()) $$('a[data-optin]').forEach(function (a) { a.setAttribute('href', '/reserver/'); });

    $$('[data-optin]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (hasAccess()) {
          if (el.tagName !== 'A') location.href = '/reserver/';
          return;
        }
        if (dlg && typeof dlg.showModal === 'function') {
          e.preventDefault();
          dlg.showModal();
          var first = $('input[name="prenom"]', dlg); if (first) setTimeout(function () { first.focus(); }, 60);
        }
      });
    });
    if (dlg) {
      $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    }
    $$('form[data-lead]').forEach(function (form) { form.addEventListener('submit', onLead); });
  }

  function onLead(e) {
    e.preventDefault();
    var form = e.currentTarget;
    var prenom = form.elements.prenom.value.trim();
    var email = form.elements.email.value.trim();
    var code = form.elements.indicatif ? form.elements.indicatif.value : '+33';
    var tel = normPhone(code, form.elements.telephone.value);
    var ok = true;
    setErr(form, 'prenom', ''); setErr(form, 'email', ''); setErr(form, 'telephone', '');
    if (prenom.length < 2) { setErr(form, 'prenom', 'Indique ton prénom.'); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setErr(form, 'email', 'Cette adresse e-mail ne semble pas complète.'); ok = false; }
    if (tel.replace(/\D/g, '').length < 9) { setErr(form, 'telephone', 'Ce numéro semble incomplet.'); ok = false; }
    if (!ok) { var bad = $('[aria-invalid="true"]', form); if (bad) bad.focus(); return; }

    var btn = $('button[type="submit"]', form);
    busy(btn, true, 'Un instant');
    var marketing = form.elements.marketing && form.elements.marketing.checked;
    var u = utm();
    var payload = {
      _subject: 'Nouveau contact — ' + prenom,
      _template: 'table',
      _captcha: 'false',
      _autoresponse: 'Bonjour ' + prenom + ',\n\nMerci pour ta demande. Si tu n’as pas encore choisi ton créneau, termine ta réservation ici : https://www.rim-academy.fr/reserver/\n\nNassim RIM\nRIM Academy',
      etape: 'Coordonnées',
      prenom: prenom, email: email, telephone: tel,
      accord_prospection: marketing ? 'oui' : 'non',
      page: location.pathname
    };
    Object.keys(u).forEach(function (k) { payload[k] = u[k]; });

    store.set('sessionStorage', 'ra_lead', { prenom: prenom, email: email, tel: tel });
    var gate = $('#gate'); if (gate) gate.dataset.done = '1';
    post(payload).then(function () {
      store.set('localStorage', 'ra_access', { t: Date.now() });
      track('lead_optin', { method: 'video_gate' }, ['track', 'Lead']);
      setTimeout(function () {
        if (page === 'video' || page === 'reserver') { busy(btn, false); unlockVideo(); }
        else location.href = '/reserver/';
      }, 350);
    });
  }

  /* ---------- 6. PAGE VIDÉO ---------- */
  var player = null, vslMilestones = {};
  function initVideoPage() {
    if (page !== 'video' && page !== 'reserver') return;
    if (hasAccess()) unlockVideo();
    else { $('#gate').hidden = false; if ($('#vsl-zone')) $('#vsl-zone').hidden = true; $('#reserver').hidden = true; }
    $$('.site-head a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var t = !$('#gate').hidden ? $('#gate') : $('#reserver');
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }
      });
    });
  }
  function unlockVideo() {
    var g = $('#gate'); if (g) g.hidden = true;
    if ($('#vsl-zone')) $('#vsl-zone').hidden = false;
    $('#reserver').hidden = false;
    var who = $('#hello'), p = lead().prenom;
    if (who && p) who.textContent = page === 'reserver' ? p + ', plus que 7 questions et tu choisis ton créneau.' : p + ', ton accès est débloqué';
    rstep(2);
    if (page === 'reserver' && $('#gate').dataset.done) $('#reserver').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    startPlayer();
    if (location.hash === '#reserver') setTimeout(function () { $('#reserver').scrollIntoView(); }, 100);
  }
  function rstep(n) {
    $$('.rsteps li').forEach(function (li) {
      var k = +li.getAttribute('data-rstep');
      li.classList.toggle('on', k === n); li.classList.toggle('done', k < n);
    });
  }
  function startPlayer() {
    if (!CFG.youtubeId || player) return;
    var overlay = $('#unmute');
    window.onYouTubeIframeAPIReady = function () {
      player = new window.YT.Player('vsl-frame', {
        host: 'https://www.youtube-nocookie.com',
        videoId: CFG.youtubeId,
        playerVars: { autoplay: 1, mute: 1, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: function (e) { e.target.mute(); e.target.playVideo(); setInterval(checkProgress, 1000); },
          onStateChange: function (e) {
            if (e.data === 0) track('vsl_complete', {}, ['trackCustom', 'VSLComplete']);
          }
        }
      });
    };
    loadScript('https://www.youtube.com/iframe_api');
    if (overlay) {
      overlay.hidden = false;
      overlay.addEventListener('click', function () {
        if (!player || !player.unMute) return;
        player.unMute(); player.setVolume(100); player.seekTo(0, true); player.playVideo();
        overlay.hidden = true;
      });
    }
  }
  function checkProgress() {
    if (!player || !player.getDuration) return;
    var d = player.getDuration(), c = player.getCurrentTime();
    if (!d) return;
    var pct = c / d;
    if (pct >= 0.5 && !vslMilestones.half) {
      vslMilestones.half = true;
      track('view_vsl_50', { video: CFG.youtubeId }, ['trackCustom', 'ViewVSL50']);
    }
  }

  /* ---------- 7. QUESTIONNAIRE + CALENDRIER ---------- */
  function initQualif() {
    var form = $('#qualif');
    if (!form) return;
    var steps = $$('.q-step', form), i = 0, pointer = false;
    var bar = $('.qbar span', form), count = $('.qcount', form);
    var next = $('#q-next', form), back = $('#q-back', form);
    form.classList.add('is-stepped');

    function show(n) {
      steps.forEach(function (s, k) { s.hidden = k !== n; });
      bar.style.width = Math.round(((n + 1) / steps.length) * 100) + '%';
      count.textContent = 'Question ' + (n + 1) + ' sur ' + steps.length;
      back.style.visibility = n === 0 ? 'hidden' : 'visible';
      next.textContent = n === steps.length - 1 ? 'Voir les créneaux' : 'Continuer';
      var f = $('input, textarea', steps[n]);
      if (f && n > 0) f.focus({ preventScroll: true });
    }
    function valid(n) {
      var s = steps[n], req = $$('[required]', s);
      if (!req.length) return true;
      var r = req[0];
      if (r.type === 'radio') return !!$('input[name="' + r.name + '"]:checked', s);
      return r.value.trim().length > 2;
    }
    function go() {
      var err = $('.q-err', steps[i]);
      if (!valid(i)) { if (err) err.textContent = $('textarea, input[type="text"]', steps[i]) ? 'Écris quelques mots pour continuer.' : 'Choisis une réponse pour continuer.'; return; }
      if (err) err.textContent = '';
      if (i < steps.length - 1) { i++; show(i); } else submit();
    }
    form.addEventListener('pointerdown', function () { pointer = true; });
    form.addEventListener('keydown', function (e) {
      pointer = false;
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') { e.preventDefault(); go(); }
    });
    form.addEventListener('change', function (e) {
      if (e.target.type === 'radio' && pointer) setTimeout(go, 240);
    });
    next.addEventListener('click', go);
    back.addEventListener('click', function () { if (i > 0) { i--; show(i); } });
    form.addEventListener('submit', function (e) { e.preventDefault(); go(); });
    show(0);

    function label(name) {
      var el = $('[name="' + name + '"]:checked', form) || form.elements[name];
      if (!el) return '';
      if (el.type === 'radio') return el.getAttribute('data-label') || el.value;
      return (el.value || '').trim();
    }
    function submit() {
      var fields = ['ville', 'etape', 'heures', 'quand', 'budget', 'engagement', 'pourquoi'];
      var ans = {}; fields.forEach(function (f) { ans[f] = label(f); });
      var raw = {}; ['heures', 'quand', 'budget', 'engagement'].forEach(function (f) { var c = $('[name="' + f + '"]:checked', form); raw[f] = c ? c.value : ''; });
      var reasons = Object.keys(CFG.disqualify).filter(function (k) { return CFG.disqualify[k].indexOf(raw[k]) !== -1; });
      var qualified = reasons.length === 0;
      var summary = [
        'Ville : ' + ans.ville, 'Étape : ' + ans.etape, 'Temps : ' + ans.heures,
        'Démarrage : ' + ans.quand, 'Budget : ' + ans.budget,
        'Engagement : ' + ans.engagement, 'Pourquoi maintenant : ' + (ans.pourquoi || '—')
      ].join(' | ');

      var btn = next; busy(btn, true, 'Envoi');
      var l = lead(), u = utm();
      var payload = {
        _subject: (qualified ? 'Qualifié — ' : 'Non qualifié — ') + (l.prenom || 'Prospect') + ' (' + ans.ville + ')',
        _template: 'table', _captcha: 'false',
        etape: 'Questionnaire', statut: qualified ? 'QUALIFIÉ' : 'NON QUALIFIÉ (' + reasons.join(', ') + ')',
        prenom: l.prenom || '', email: l.email || '', telephone: l.tel || ''
      };
      fields.forEach(function (f) { payload[f] = ans[f]; });
      Object.keys(u).forEach(function (k) { payload[k] = u[k]; });

      post(payload).then(function () {
        busy(btn, false);
        track('qualif_submit', { qualifie: qualified ? 'oui' : 'non' }, ['trackCustom', 'QualifSubmit']);
        form.hidden = true;
        var hd = $('#reserver-t'); if (hd) { hd.hidden = true; if (hd.nextElementSibling) hd.nextElementSibling.hidden = true; }
        if (qualified) showCalendar(summary); else showDq(reasons);
      });
    }
  }
  function showCalendar(summary) {
    var box = $('#res-ok'); box.hidden = false; rstep(3);
    var cal = $('#cal');
    if (!CFG.calendlyUrl) {
      cal.innerHTML = '<p class="warn">Le calendrier n’est pas encore relié. Écris-moi à rim.conciergerie@gmail.com pour fixer ton appel.</p>';
      return;
    }
    var l = lead(), u = utm(), url;
    try { url = new URL(CFG.calendlyUrl); } catch (e) { return; }
    // Pré-remplissage Calendly : name, email, puis a1 = 1re question (Téléphone), a2 = 2e question (Réponses).
    if (l.prenom) url.searchParams.set('name', l.prenom);
    if (l.email) url.searchParams.set('email', l.email);
    if (l.tel) url.searchParams.set('a1', l.tel);
    url.searchParams.set('a2', summary);
    Object.keys(u).forEach(function (k) { url.searchParams.set(k, u[k]); });
    url.searchParams.set('embed_domain', location.hostname);
    url.searchParams.set('embed_type', 'Inline');
    var f = document.createElement('iframe');
    f.src = url.toString();
    f.title = 'Choisir un créneau pour ton appel découverte';
    f.setAttribute('frameborder', '0');
    f.style.width = '100%'; f.style.minWidth = '300px'; f.style.height = '760px'; f.style.border = '0';
    cal.appendChild(f);
    window.addEventListener('message', function (e) {
      if (e.origin !== 'https://calendly.com' || !e.data || typeof e.data.event !== 'string') return;
      if (e.data.event === 'calendly.page_height' && e.data.payload && e.data.payload.height) {
        f.style.height = e.data.payload.height;
      }
      if (e.data.event === 'calendly.event_scheduled') {
        location.href = '/merci/';
      }
    });
    box.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
  function showDq(reasons) {
    var box = $('#res-no'); box.hidden = false;
    reasons.forEach(function (r) { var p = $('[data-dq="' + r + '"]', box); if (p) p.hidden = false; });
    box.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- 8. VIDÉOS TÉMOIGNAGES (chargées au clic) ---------- */
  function initTestimonials() {
    var playing = null;
    $$('.vplay').forEach(function (b) {
      var src = b.getAttribute('data-src');
      if (!src) { b.disabled = true; return; }
      b.addEventListener('click', function () {
        var img = $('img', b);
        var box = document.createElement('div');
        box.className = 'vplay is-playing';
        var v = document.createElement('video');
        v.src = src;
        if (img) v.poster = img.currentSrc || img.src;
        v.controls = true;
        v.playsInline = true;
        v.setAttribute('playsinline', '');
        v.preload = 'auto';
        var nm = $('.vmeta strong', b);
        v.setAttribute('aria-label', 'Témoignage vidéo' + (nm ? ' de ' + nm.textContent : ''));
        box.appendChild(v);
        b.parentNode.replaceChild(box, b);
        v.addEventListener('play', function () {
          if (playing && playing !== v) playing.pause();
          playing = v;
        });
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
        v.focus({ preventScroll: true });
        track('testimonial_play', { video: src.split('/').pop() }, ['trackCustom', 'TestimonialPlay']);
      }, { once: true });
    });
  }

  /* ---------- 9. DIVERS ---------- */
  function legacyHash() {
    var map = { '#cgv': '/cgv/', '#mentions-legales': '/mentions-legales/', '#confidentialite': '/confidentialite/', '#contact-page': '/mentions-legales/#contact' };
    if (map[location.hash]) location.replace(map[location.hash]);
  }
  function initMerci() {
    if (page !== 'merci') return;
    var p = lead().prenom, h = $('#merci-hello');
    if (p && h) h.textContent = p + ', ton appel est réservé.';
    if (!store.get('sessionStorage', 'ra_scheduled')) {
      store.set('sessionStorage', 'ra_scheduled', 1);
      var fire = function () { track('schedule', {}, ['track', 'Schedule']); };
      setTimeout(fire, 1200);
    }
  }
  function initWhatsApp() {
    $$('[data-wa]').forEach(function (a) {
      a.addEventListener('click', function () { track('contact_whatsapp', { page: location.pathname }, ['track', 'Contact']); });
    });
  }
  function initSplash() {
    var s = $$('.splash');
    if (!s.length) return;
    try { sessionStorage.setItem('ra_splash', '1'); } catch (e) {}
    setTimeout(function () { s.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); }); }, 1600);
  }
  function initHeadReveal() {
    var h = $('.site-head[data-reveal]');
    if (!h) return;
    var hero = $('.hero');
    var on = function () {
      var lim = hero && hero.offsetHeight ? hero.offsetHeight * 0.55 : 380;
      h.classList.toggle('is-shown', window.scrollY > lim);
    };
    window.addEventListener('scroll', on, { passive: true });
    on();
  }
  function initMandat() {
    var m = $('.mandat');
    if (!m) return;
    if (reduceMotion || !('IntersectionObserver' in window)) { m.classList.add('is-drawn'); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { m.classList.add('is-drawn'); io.disconnect(); } });
    }, { threshold: 0.45 });
    io.observe(m);
  }

  if (page === 'home') legacyHash();
  initCookies();
  initOptin();
  initVideoPage();
  initQualif();
  initTestimonials();
  initMerci();
  initMandat();
  initWhatsApp();
  initHeadReveal();
  initSplash();
})();
