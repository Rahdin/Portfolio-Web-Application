/* ============================================================
   Lean, fast portfolio script.
   No canvas, no custom cursor, no mousemove handlers.
   Only: IntersectionObservers + one passive scroll listener.
   ============================================================ */
(() => {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Year ---- */
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---- Scroll progress + nav state (single passive listener, rAF-throttled) ---- */
  const progress = $('#progress');
  const nav = $('#nav');
  let ticking = false;

  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const frac = max > 0 ? h.scrollTop / max : 0;
    if (progress) progress.style.transform = `scaleX(${frac})`;
    if (nav) nav.classList.toggle('scrolled', h.scrollTop > 30);
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---- Active nav link ---- */
  const links = $$('.nav-links a[data-nav]');
  const map = new Map();
  links.forEach(l => {
    const sec = document.getElementById(l.getAttribute('href').slice(1));
    if (sec) map.set(sec, l);
  });
  if (map.size) {
    const navObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          map.get(e.target)?.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, sec) => navObs.observe(sec));
  }

  /* ---- Mobile menu ---- */
  const burger = $('#burger');
  const navLinks = $('#navLinks');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    navLinks.addEventListener('click', e => {
      if (e.target.closest('a')) {
        burger.classList.remove('open');
        navLinks.classList.remove('open');
      }
    });
  }

  /* ---- Theme toggle (persisted) ---- */
  const themeBtn = $('#themeBtn');
  if (localStorage.getItem('theme') === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  themeBtn?.addEventListener('click', () => {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    if (light) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  });

  /* ---- Reveal on scroll ---- */
  const reveals = $$('.reveal');
  if (reduce) {
    reveals.forEach(el => el.classList.add('in'));
  } else {
    const revObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          revObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => revObs.observe(el));
  }

  /* ---- Count-up (supports decimals / prefix / suffix), runs once ---- */
  const counters = $$('.count');
  const runCount = (el) => {
    const target  = parseFloat(el.dataset.target) || 0;
    const dec      = parseInt(el.dataset.decimals || '0', 10);
    const prefix   = el.dataset.prefix || '';
    const suffix   = el.dataset.suffix || '';
    if (reduce) { el.textContent = prefix + target.toFixed(dec) + suffix; return; }
    const dur = 1400, t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * eased).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target.toFixed(dec) + suffix;
    };
    requestAnimationFrame(step);
  };
  if (counters.length) {
    const cObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { runCount(e.target); cObs.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(c => cObs.observe(c));
  }

  /* ---- Smooth anchor scroll with nav offset ---- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length <= 1) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      const top = t.getBoundingClientRect().top + scrollY - 64;
      scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---- Back to top ---- */
  $('#toTop')?.addEventListener('click', () =>
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
})();
