/* ZOE Research & Development Consultancy: site interactions */
(function () {
  'use strict';

  var CONTACT = {
    email: 'info@zoeresearchconsultance.co.ke',
    emailAlt: 'zoeresearchconsultancy@gmail.com'
  };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Accounts: Log In button in the top bar opens a login dialog ----------
     Guests see only the landing page. Accounts are kept in this browser only
     (localStorage). Swap these functions for a real server before going live. */
  (function auth() {
    var html = document.documentElement;
    var modal = document.getElementById('auth-modal');
    var ACC = 'zoe-accounts', SES = 'zoe-session';
    function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
    function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
    function hash(str) {
      if (window.crypto && crypto.subtle && window.TextEncoder) {
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode('zoe:' + str)).then(function (b) {
          return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
        });
      }
      var h = 5381; for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
      return Promise.resolve('d' + (h >>> 0).toString(16));
    }

    /* Demo account for local testing only (never created on the live site) */
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !load(ACC, {})['demo@zoe.co.ke']) {
      hash('Zoe@2026').then(function (h) { var a = load(ACC, {}); a['demo@zoe.co.ke'] = { name: 'Demo Visitor', hash: h, created: new Date().toISOString() }; save(ACC, a); });
    }

    var chip = document.querySelector('[data-user-chip]');
    var out = document.querySelector('[data-signout]');
    function showUser() {
      var s = load(SES, null);
      if (chip) { chip.hidden = !s; if (s) chip.querySelector('[data-user-name]').textContent = 'Welcome, ' + s.name.split(' ')[0]; }
      if (out) out.hidden = !s;
    }
    showUser();
    if (out) out.addEventListener('click', function () { try { localStorage.removeItem(SES); } catch (e) {} location.href = 'index.html'; });
    if (!modal) return;

    var steps = modal.querySelectorAll('.auth-step');
    var tabs = modal.querySelectorAll('.auth-tabs [data-go]');
    var lastFocus = null;
    function go(name, msg) {
      steps.forEach(function (s) { s.hidden = s.getAttribute('data-step') !== name; });
      tabs.forEach(function (t) { t.setAttribute('aria-selected', t.getAttribute('data-go') === name ? 'true' : 'false'); });
      var cur = modal.querySelector('[data-step="' + name + '"]');
      var m = cur.querySelector('.auth-msg');
      m.textContent = msg || ''; m.classList.toggle('is-ok', !!msg);
      var first = cur.querySelector('input'); if (first) first.focus();
    }
    function open(step) {
      lastFocus = document.activeElement;
      modal.hidden = false; html.classList.add('modal-open');
      go(step || 'login');
    }
    function close() {
      modal.hidden = true; html.classList.remove('modal-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    document.querySelectorAll('[data-login-open]').forEach(function (b) {
      b.addEventListener('click', function () { open(b.getAttribute('data-login-open') || 'login'); });
    });
    modal.querySelectorAll('[data-auth-close]').forEach(function (b) { b.addEventListener('click', close); });
    modal.querySelectorAll('[data-go]').forEach(function (b) { b.addEventListener('click', function () { go(b.getAttribute('data-go')); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });

    /* Guests: any link to another page opens the login dialog instead */
    var pendingHref = null;
    document.addEventListener('click', function (e) {
      if (!html.classList.contains('gated')) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (/^(https?:|mailto:|tel:|#)/.test(href) || /^index\.html(#.*)?$/.test(href)) return;
      e.preventDefault();
      pendingHref = href;
      open('login');
    }, true);
    if (/[?&]login=1/.test(location.search) && html.classList.contains('gated')) open('login');

    function fail(form, text) { var m = form.querySelector('.auth-msg'); m.classList.remove('is-ok'); m.textContent = text; }
    var validEmail = function (e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); };

    var reg = modal.querySelector('[data-step="register"]');
    var login = modal.querySelector('[data-step="login"]');
    reg.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = reg.elements, name = f.name.value.trim(), email = f.email.value.trim().toLowerCase(), pw = f.password.value;
      if (name.length < 2) return fail(reg, 'Please enter your full name.');
      if (!validEmail(email)) return fail(reg, 'Please enter a valid email address.');
      if (pw.length < 6) return fail(reg, 'Your password needs at least 6 characters.');
      if (pw !== f.confirm.value) return fail(reg, 'The two passwords do not match.');
      var accounts = load(ACC, {});
      if (accounts[email]) return fail(reg, 'An account with this email already exists. Please log in.');
      hash(pw).then(function (h) {
        accounts[email] = { name: name, hash: h, created: new Date().toISOString() };
        if (!save(ACC, accounts)) return fail(reg, 'Your browser blocked saving the account. Please allow site storage and try again.');
        reg.reset();
        login.elements.email.value = email;
        go('login', 'Account created. Please log in with your password.');
        login.elements.password.focus();
      });
    });

    login.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = login.elements.email.value.trim().toLowerCase(), pw = login.elements.password.value;
      if (!validEmail(email) || !pw) return fail(login, 'Please enter your email address and password.');
      var acc = load(ACC, {})[email];
      if (!acc) return fail(login, 'We could not find that account. Please create one first.');
      hash(pw).then(function (h) {
        if (h !== acc.hash) return fail(login, 'That password is not correct. Please try again.');
        save(SES, { email: email, name: acc.name, at: Date.now() });
        login.reset();
        close();
        html.classList.remove('gated');
        showUser();
        if (pendingHref) { location.href = pendingHref; return; }
        if (/[?&]login=1/.test(location.search)) history.replaceState(null, '', 'index.html');
        window.dispatchEvent(new Event('scroll'));
      });
    });
  })();

  /* ---------- Colour modes: light, dark, emerald ---------- */
  var root = document.documentElement;
  var themeButtons = document.querySelectorAll('[data-theme-set]');
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    themeButtons.forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-theme-set') === t ? 'true' : 'false'); });
  }
  applyTheme(root.getAttribute('data-theme') || 'light');
  themeButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-theme-set');
      applyTheme(t);
      try { localStorage.setItem('zoe-theme', t); } catch (e) {}
    });
  });

  /* ---------- Mobile menu ---------- */
  var navbar = document.querySelector('.navbar');
  var toggle = document.querySelector('.nav__toggle');
  if (navbar && toggle) {
    toggle.addEventListener('click', function () {
      var open = navbar.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navbar.querySelectorAll('.nav__links a').forEach(function (a) {
      a.addEventListener('click', function () { navbar.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navbar.classList.contains('is-open')) toggle.click();
    });
  }

  /* ---------- Hero slider ---------- */
  var hero = document.querySelector('[data-slider]');
  if (hero) {
    var slides = hero.querySelectorAll('.slide');
    var texts = hero.querySelectorAll('.hero__slide-text');
    var dotsWrap = hero.querySelector('.dots');
    var current = 0, timer = null, DELAY = 6500;
    var dots = Array.prototype.map.call(slides, function (s, i) {
      var d = document.createElement('button');
      d.type = 'button'; d.className = 'dot';
      d.setAttribute('aria-label', 'Show slide ' + (i + 1));
      d.addEventListener('click', function () { show(i); restart(); });
      dotsWrap.appendChild(d);
      return d;
    });
    function show(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === current); });
      if (texts.length > 1) texts.forEach(function (t, k) { t.classList.toggle('is-active', k === current); });
      dots.forEach(function (d, k) { d.classList.toggle('is-active', k === current); d.setAttribute('aria-current', k === current ? 'true' : 'false'); });
    }
    function restart() {
      clearInterval(timer);
      if (!reduceMotion) timer = setInterval(function () { show(current + 1); }, DELAY);
    }
    var prev = hero.querySelector('.arrow--prev'), next = hero.querySelector('.arrow--next');
    if (prev) prev.addEventListener('click', function () { show(current - 1); restart(); });
    if (next) next.addEventListener('click', function () { show(current + 1); restart(); });
    hero.addEventListener('mouseenter', function () { clearInterval(timer); });
    hero.addEventListener('mouseleave', restart);
    var q = new URLSearchParams(window.location.search).get('slide');
    show(q ? parseInt(q, 10) - 1 || 0 : 0);
    restart();
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Count-up figures ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, end = parseFloat(el.getAttribute('data-count')), start = performance.now();
        (function tick(now) {
          var k = Math.min(1, (now - start) / 1400);
          el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(tick);
        })(start);
        co.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ---------- Forms ----------
     Front end only: each form composes an email in the visitor's mail app.
     Replace with a POST to your backend or form service when ready. */
  function wireForm(form, subjectFn, linesFn, okText) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var f = form.elements;
      var v = function (n) { return f[n] && f[n].value ? f[n].value.trim() : ''; };
      window.location.href = 'mailto:' + CONTACT.email + '?cc=' + encodeURIComponent(CONTACT.emailAlt) +
        '&subject=' + encodeURIComponent(subjectFn(v)) + '&body=' + encodeURIComponent(linesFn(v).join('\n'));
      var status = form.querySelector('.form__status');
      if (status) { status.hidden = false; status.textContent = okText; }
    });
  }
  document.querySelectorAll('form[data-brief]').forEach(function (form) {
    var svc = new URLSearchParams(window.location.search).get('service');
    if (svc && form.elements.service) form.elements.service.value = svc;
    wireForm(form,
      function (v) { return 'Enquiry from ' + (v('organisation') || v('name')); },
      function (v) {
        return ['ENQUIRY FROM THE ZOE WEBSITE', '', 'Name: ' + v('name'), 'Organisation: ' + v('organisation'),
          'Email: ' + v('email'), 'Phone: ' + v('phone'), '', 'Service of interest: ' + v('service'),
          'Timeline: ' + v('timeline'), 'Budget range: ' + (v('budget') || 'Not stated'), '',
          'WHAT WE NEED HELP WITH:', v('decision'), '', 'WHAT WE WILL DO WITH THE FINDINGS:', v('difference') || 'Not stated'];
      },
      'Thank you. Your email app should now open with your message ready to send. If it does not, email ' + CONTACT.email + ' or call +254 796 808 996.');
  });
  document.querySelectorAll('form[data-testimonial]').forEach(function (form) {
    wireForm(form,
      function (v) { return 'Client feedback from ' + (v('organisation') || v('name')); },
      function (v) {
        return ['CLIENT FEEDBACK FROM THE ZOE WEBSITE', '', 'Name: ' + v('name'), 'Role: ' + v('role'),
          'Organisation: ' + v('organisation'), 'Service received: ' + v('service'), '', 'FEEDBACK:', v('feedback'), '',
          'May ZOE publish this on its website? ' + (f_yes(v) ? 'Yes' : 'No')];
      },
      'Thank you for sharing your experience. Your email app should now open with your feedback ready to send.');
  });
  function f_yes(v) { return v('consent') === 'yes'; }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
