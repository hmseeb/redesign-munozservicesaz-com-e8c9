/* ==========================================================================
   Muñoz Services LLC — site interactions
   Vanilla JS, no dependencies, no external requests.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------------- Year */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------ Sticky header */
  var header = $('.site-header');
  var toTop  = $('#to-top');

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (header) header.classList.toggle('is-stuck', y > 8);
    if (toTop)  toTop.classList.toggle('is-visible', y > 600);
    setActiveLink(y);
  }

  /* ------------------------------------------------------- Mobile menu */
  var burger = $('#burger');
  var nav    = $('#nav');

  function closeMenu() {
    if (!nav || !burger) return;
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('is-locked');
  }

  function toggleMenu() {
    if (!nav || !burger) return;
    var open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('is-locked', open);
  }

  if (burger) burger.addEventListener('click', toggleMenu);

  $$('.nav a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 960) closeMenu();
  });

  /* -------------------------------------------------- Active nav link */
  var navLinks = $$('.nav__link');
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute('href');
      return id && id.charAt(0) === '#' && id.length > 1 ? document.getElementById(id.slice(1)) : null;
    })
    .filter(Boolean);

  function setActiveLink(y) {
    if (!sections.length) return;
    var offset = (header ? header.offsetHeight : 0) + 40;
    var currentId = sections[0].id;

    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= offset) currentId = sections[i].id;
    }

    // Pinned to the bottom of the page → last section wins.
    if (y + window.innerHeight >= document.documentElement.scrollHeight - 4) {
      currentId = sections[sections.length - 1].id;
    }

    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + currentId);
    });
  }

  /* --------------------------------------------------- Reveal on scroll */
  var revealables = $$('.reveal');

  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // Stagger siblings slightly for a softer cascade.
        var siblings = el.parentElement ? $$('.reveal', el.parentElement) : [];
        var idx = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = Math.min(idx * 80, 320) + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------- Ticker */
  // The CSS keyframe translates the track by -50%, so the content must be
  // duplicated exactly once for a seamless loop.
  var ticker = $('#ticker');
  if (ticker && !reduceMotion) {
    ticker.innerHTML += ticker.innerHTML;
  }

  /* -------------------------------------------------------- Back to top */
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------------ Lightbox */
  var lightbox = $('#lightbox');
  var lbImg    = $('#lb-img');
  var lbCap    = $('#lb-cap');
  var lbClose  = $('#lb-close');
  var lbPrev   = $('#lb-prev');
  var lbNext   = $('#lb-next');
  var tiles    = $$('.tile');
  var lbIndex  = 0;
  var lastFocus = null;

  function renderLightbox(i) {
    var tile = tiles[i];
    if (!tile) return;
    var img = $('img', tile);
    lbImg.setAttribute('src', tile.getAttribute('data-src') || (img ? img.src : ''));
    lbImg.setAttribute('alt', img ? img.getAttribute('alt') || '' : '');
    lbCap.textContent = tile.getAttribute('data-caption') || '';
    lbIndex = i;
  }

  function openLightbox(i) {
    if (!lightbox) return;
    lastFocus = document.activeElement;
    renderLightbox(i);
    lightbox.hidden = false;
    document.body.classList.add('is-locked');
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove('is-locked');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function step(delta) {
    if (!tiles.length) return;
    renderLightbox((lbIndex + delta + tiles.length) % tiles.length);
  }

  tiles.forEach(function (tile, i) {
    tile.addEventListener('click', function () { openLightbox(i); });
  });

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev)  lbPrev.addEventListener('click', function () { step(-1); });
  if (lbNext)  lbNext.addEventListener('click', function () { step(1); });

  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (lightbox && !lightbox.hidden) {
      if (e.key === 'Escape')     { closeLightbox(); }
      if (e.key === 'ArrowLeft')  { step(-1); }
      if (e.key === 'ArrowRight') { step(1); }

      // Keep focus inside the dialog while it is open.
      if (e.key === 'Tab') {
        var focusables = [lbClose, lbPrev, lbNext].filter(Boolean);
        if (!focusables.length) return;
        var first = focusables[0];
        var last  = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      return;
    }

    if (e.key === 'Escape' && nav && nav.classList.contains('is-open')) closeMenu();
  });

  /* -------------------------------------------------------- Contact form */
  var form   = $('#contact-form');
  var okMsg  = $('#form-ok');
  var errMsg = $('#form-err');

  var RULES = {
    name:    { test: function (v) { return v.length >= 2; },
               msg: 'Please enter your name.' },
    email:   { test: function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v); },
               msg: 'Please enter a valid email address.' },
    phone:   { test: function (v) { return (v.replace(/\D/g, '')).length >= 7; },
               msg: 'Please enter a phone number we can reach you at.' },
    message: { test: function (v) { return v.length >= 5; },
               msg: 'Please tell us a little about what you need.' }
  };

  function showError(field, message) {
    var wrap = field.closest('.field');
    var slot = wrap ? $('.field__error', wrap) : null;
    if (wrap) wrap.classList.toggle('has-error', Boolean(message));
    if (slot) slot.textContent = message || '';
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validateField(field) {
    var rule = RULES[field.name];
    if (!rule) return true;
    var value = (field.value || '').trim();
    var valid = rule.test(value);
    showError(field, valid ? '' : rule.msg);
    return valid;
  }

  if (form) {
    var fields = $$('input, textarea', form);

    fields.forEach(function (field) {
      field.addEventListener('blur', function () { validateField(field); });
      field.addEventListener('input', function () {
        var wrap = field.closest('.field');
        if (wrap && wrap.classList.contains('has-error')) validateField(field);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (okMsg)  okMsg.hidden = true;
      if (errMsg) errMsg.hidden = true;

      var firstBad = null;
      fields.forEach(function (field) {
        if (!validateField(field) && !firstBad) firstBad = field;
      });

      if (firstBad) {
        firstBad.focus();
        return;
      }

      // No backend and no third-party services: hand the message to the
      // visitor's own mail client, pre-addressed and pre-filled.
      try {
        var get = function (n) { var f = form.elements[n]; return f ? f.value.trim() : ''; };
        var subject = 'Website enquiry from ' + get('name');
        var body = [
          'Name: '    + get('name'),
          'Email: '   + get('email'),
          'Phone: '   + get('phone'),
          '',
          'Message:',
          get('message')
        ].join('\n');

        window.location.href =
          'mailto:munozservices00@gmail.com' +
          '?subject=' + encodeURIComponent(subject) +
          '&body='    + encodeURIComponent(body);

        if (okMsg) okMsg.hidden = false;
        form.reset();
        fields.forEach(function (field) { showError(field, ''); });
      } catch (err) {
        if (errMsg) errMsg.hidden = false;
      }
    });
  }

  /* --------------------------------------------------------------- Init */
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
