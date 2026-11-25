/* ZOE Research & Development Consultancy: site interactions */
(function () {
  'use strict';

  var CONTACT = {
    email: 'info@zoeresearchconsultance.co.ke',
    emailAlt: 'zoeresearchconsultancy@gmail.com'
  };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;


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
