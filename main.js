// Scroll-driven state for the case study. Writes CSS custom properties and
// data attributes only; every visual lives in styles.css.
(() => {
  const root = document.documentElement;
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp01 = (x) => Math.min(Math.max(x, 0), 1);

  const hero = document.querySelector('[data-hero]');
  const railTrack = document.querySelector('.rail-track');
  const railLinks = $$('.rail a');
  const scenes = $$('[data-scene]');
  const stepGroups = $$('[data-steps]').map((el) => ({ el, steps: $$('[data-step]', el), idx: -2 }));
  const fills = $$('[data-fill]');
  const chapters = $$('[data-ch]');

  let active = null;
  let raf = 0;

  const reveals = $$('[data-r]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.setAttribute('data-in', ''); io.unobserve(e.target); }
      }
    }, { threshold: 0.12 });
    reveals.forEach((n) => io.observe(n));
  } else {
    reveals.forEach((n) => n.setAttribute('data-in', ''));
  }

  function apply() {
    raf = 0;
    const vh = window.innerHeight;

    if (railTrack) {
      const range = root.scrollHeight - vh;
      railTrack.style.setProperty('--pp', (range > 0 ? clamp01(window.scrollY / range) : 0).toFixed(4));
    }

    if (hero) hero.style.setProperty('--hp', clamp01(-hero.getBoundingClientRect().top / (vh * 0.9)).toFixed(4));

    for (const el of scenes) {
      const b = el.getBoundingClientRect();
      if (b.bottom < -vh || b.top > vh * 2) continue;
      const span = b.height - vh;
      el.style.setProperty('--sp', (span > 0 ? clamp01(-b.top / span) : 1).toFixed(4));
    }

    // Step groups: data-s0..n mark every step whose top has passed 60% of the viewport.
    // On narrow screens the pinned phone covers the top of the viewport, so the line sits lower.
    const line = vh * (root.clientWidth <= 900 ? 0.85 : 0.6);
    for (const g of stepGroups) {
      let idx = -1;
      g.steps.forEach((st, i) => { if (st.getBoundingClientRect().top < line) idx = i; });
      if (idx === g.idx) continue;
      g.idx = idx;
      g.steps.forEach((_, i) => g.el.toggleAttribute('data-s' + i, i <= idx));
    }

    for (const n of fills) {
      const b = n.getBoundingClientRect();
      const start = vh - b.height * 0.3;
      const end = vh * 0.35;
      n.style.setProperty('--f', clamp01((start - b.top) / (start - end)).toFixed(3));
    }

    let ch = null;
    for (const c of chapters) if (c.getBoundingClientRect().top < vh * 0.5) ch = c.getAttribute('data-ch');
    if (ch !== active) {
      active = ch;
      railLinks.forEach((a, i) => {
        if (String(i + 1) === ch) a.setAttribute('aria-current', 'step');
        else a.removeAttribute('aria-current');
      });
    }
  }

  function schedule() { if (!raf) raf = requestAnimationFrame(apply); }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  window.addEventListener('pageshow', schedule);
  if (document.fonts) document.fonts.ready.then(schedule);
  schedule();
})();
