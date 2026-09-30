/* Landing-page motion and scroll behaviour. Loaded beside the gift engine; it only touches the landing view.
   Rules it follows:
   - transform and opacity only, 100-320 ms (long or layout-changing motion hurts speed and conversion);
   - content is visible without JavaScript: reveal styles exist only once this script has added `js-motion`;
   - nothing runs for visitors who prefer reduced motion (the stylesheet also switches the animations off);
   - the first screen is never animated in, so it never delays what the visitor came to see. */
(() => {
  const home = document.getElementById('homeView');
  if (!home) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canObserve = 'IntersectionObserver' in window;

  /* 1. Reveal sections as they scroll into view (only those below the first screen). */
  if (!reduce && canObserve) {
    const below = innerHeight * 0.92;
    const targets = [...home.querySelectorAll('.chooser-heading, .occasion-card, .how-heading, .how-step, .chooser-bottom')]
      .filter((el) => el.getBoundingClientRect().top > below);
    if (targets.length) {
      document.documentElement.classList.add('js-motion');
      targets.forEach((el, i) => { el.classList.add('reveal'); el.style.setProperty('--i', String(i % 4)); });
      const reveal = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          el.classList.add('in');
          reveal.unobserve(el);
          // Hand the element back to its normal styles (hover effects included) once it has arrived.
          setTimeout(() => { el.classList.remove('reveal', 'in'); el.style.removeProperty('--i'); }, 900);
        }
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
      targets.forEach((el) => reveal.observe(el));
    }
  }

  /* 2. Sticky call to action on phones: appears once the hero button has scrolled away and hides
        again while the gift chooser (the real call to action) or the resume card is on screen. */
  const sticky = document.getElementById('stickyCta');
  const heroButton = document.getElementById('primaryCreate');
  const chooser = document.getElementById('gifts');
  if (sticky && heroButton && chooser && canObserve) {
    const seen = { hero: true, chooser: false };
    const update = () => {
      const resume = document.getElementById('resumeBanner')?.dataset.on === '1';
      const show = !home.hidden && !seen.hero && !seen.chooser && !resume;
      sticky.classList.toggle('show', show);
      sticky.inert = !show;
    };
    const watch = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === heroButton) seen.hero = entry.isIntersecting;
        if (entry.target === chooser) seen.chooser = entry.isIntersecting;
      }
      update();
    }, { threshold: [0, 0.12] });
    watch.observe(heroButton);
    watch.observe(chooser);
    new MutationObserver(update).observe(home, { attributes: true, attributeFilter: ['hidden'] });
    const banner = document.getElementById('resumeBanner');
    if (banner) new MutationObserver(update).observe(banner, { attributes: true, attributeFilter: ['data-on'] });
  }
})();
