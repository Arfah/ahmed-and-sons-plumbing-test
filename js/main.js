/* Ahmed & Sons Plumbing — navigation, reveals, count-ups, parallax.
   Everything degrades: with this file absent the page renders complete. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Opt in to animated starting states only once JS is confirmed running.
  root.classList.add('js');

  /* ---------------------------------------------------------------------
     Navigation: scrolled state, current-section highlight, mobile menu
     --------------------------------------------------------------------- */
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('nav-toggle');
  var menu = document.getElementById('menu');
  var hero = document.querySelector('.hero');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));

  function onScroll() {
    var past = window.scrollY > (hero ? hero.offsetHeight - 80 : 80);
    nav.classList.toggle('is-scrolled', past);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) {
    if (e.matches) setMenu(false);
  });

  // Highlight the nav link for the section currently in view.
  var sections = navLinks.map(function (a) {
    return document.querySelector(a.getAttribute('href'));
  }).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var current = null;
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) current = entry.target.id;
      });
      navLinks.forEach(function (a) {
        var active = a.getAttribute('href') === '#' + current;
        a.classList.toggle('is-active', active);
        if (active) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------------------------------------------------------------------
     Hero load sequence
     --------------------------------------------------------------------- */
  if (hero) {
    var heroImg = hero.querySelector('.hero__media img');
    var startHero = function () {
      // Next frame so the starting states have been painted first.
      requestAnimationFrame(function () { hero.classList.add('is-loaded'); });
    };
    if (reduceMotion) {
      hero.classList.add('is-loaded');
    } else if (heroImg && !heroImg.complete) {
      heroImg.addEventListener('load', startHero, { once: true });
      heroImg.addEventListener('error', startHero, { once: true });
      // Don't wait forever on a slow connection.
      setTimeout(startHero, 1500);
    } else {
      startHero();
    }

    // Light parallax on desktop only: transform-only, a few percent of travel,
    // applied to the <picture> wrapper so it never fights the image's settle transition.
    var heroPic = hero.querySelector('.hero__media picture');
    if (!reduceMotion && heroPic && window.matchMedia('(min-width: 900px)').matches) {
      var ticking = false;
      var parallax = function () {
        var y = window.scrollY;
        var h = hero.offsetHeight;
        if (y <= h) {
          heroPic.style.transform = 'translate3d(0,' + Math.round(y * 0.04) + 'px,0)';
        }
        ticking = false;
      };
      window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
      }, { passive: true });
    } else if (heroPic) {
      heroPic.style.willChange = 'auto';
    }
  }

  /* ---------------------------------------------------------------------
     Section reveals: fire once, unobserve after firing
     --------------------------------------------------------------------- */
  var scopes = Array.prototype.slice.call(document.querySelectorAll('.reveal-scope, .band'));

  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
    var duration = 600;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(step);
  }

  function revealScope(scope) {
    scope.classList.add('is-visible');
    Array.prototype.forEach.call(scope.querySelectorAll('[data-count]'), countUp);
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    scopes.forEach(revealScope);
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          revealScope(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    scopes.forEach(function (s) {
      // Anything already on screen at load must not wait on a scroll.
      var r = s.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.85) revealScope(s);
      else revealObserver.observe(s);
    });
  }

  /* ---------------------------------------------------------------------
     Footer year
     --------------------------------------------------------------------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
