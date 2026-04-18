/* Zuuma — scrollytelling
   GSAP + ScrollTrigger scenes. Apple-style feature narratives.
   - Hero: bag drifts up + scales with subtle parallax as you leave hero
   - Feature scenes: sticky visual crossfades between detail shots as narrative cards
     scroll past; progress ticks light up in rhythm
   - Stat strip count-up, prints stagger, about accent bar, media parallax
*/
(function () {
  const motion = window.ZuumaMotion || { scrollytelling: true, reduceMotion: false };
  if (!motion.scrollytelling) return;

  function ready(cb) {
    if (document.readyState !== 'loading') cb();
    else document.addEventListener('DOMContentLoaded', cb);
  }

  function waitForGsap(cb, tries) {
    tries = tries == null ? 40 : tries;
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      cb();
    } else if (tries > 0) {
      setTimeout(() => waitForGsap(cb, tries - 1), 80);
    }
  }

  function bindLenisToScrollTrigger() {
    if (!window.ZuumaMotion.lenis) {
      document.addEventListener('zuuma:lenis-ready', bindLenisToScrollTrigger, { once: true });
      return;
    }
    const lenis = window.ZuumaMotion.lenis;
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function isDesktop() {
    return window.matchMedia('(min-width: 961px)').matches;
  }

  /* ---------- Hero bag handoff into features ---------- */
  function buildHeroBagParallax() {
    const stage = document.querySelector('.hero-pin [data-bag-stage]');
    if (!stage) return;
    const gsap = window.gsap;

    // Bag scales down + drifts up + fades as hero exits — reads as a handoff
    // to the first feature-visual in the next section.
    gsap.to(stage, {
      yPercent: -22,
      scale: 0.84,
      opacity: 0.55,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    // First feature-visual of #bag-features enters oversized + transparent,
    // settles to 1.0/1.0 as the section arrives — visually "catches" the hero bag.
    const firstVisual = document.querySelector(
      '#bag-features [data-feature-visual="1"]'
    );
    if (firstVisual) {
      gsap.fromTo(firstVisual,
        { scale: 1.12, opacity: 0 },
        {
          scale: 1, opacity: 1, ease: 'none',
          scrollTrigger: {
            trigger: '#bag-features',
            start: 'top 90%',
            end: 'top 30%',
            scrub: true
          }
        }
      );
    }
  }

  /* ---------- Feature scene: sticky visual + narrative cards ---------- */
  function buildFeatureScene(section) {
    if (!section) return;
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    const visuals = section.querySelectorAll('[data-feature-visual]');
    const cards = section.querySelectorAll('[data-feature-card]');
    const ticks = section.querySelectorAll('[data-feature-tick]');
    if (!cards.length || !visuals.length) return;

    function setActive(index) {
      visuals.forEach((v) => {
        const i = parseInt(v.dataset.featureVisual, 10);
        v.classList.toggle('is-active', i === index);
      });
      cards.forEach((c) => {
        const i = parseInt(c.dataset.featureCard, 10);
        c.classList.toggle('is-active', i === index);
      });
      ticks.forEach((t) => {
        const i = parseInt(t.dataset.featureTick, 10);
        t.classList.toggle('is-active', i <= index);
      });
    }

    cards.forEach((card) => {
      const i = parseInt(card.dataset.featureCard, 10);
      ScrollTrigger.create({
        trigger: card,
        start: 'top 65%',
        end: 'bottom 40%',
        onEnter: () => setActive(i),
        onEnterBack: () => setActive(i)
      });
    });

    // Subtle scale/parallax on the active visual as user scrolls the scene
    const stack = section.querySelector('.feature-visual-stack');
    if (stack) {
      gsap.fromTo(stack,
        { scale: 0.98, yPercent: 2 },
        {
          scale: 1.02, yPercent: -2, ease: 'none',
          scrollTrigger: { trigger: section, start: 'top 80%', end: 'bottom top', scrub: true }
        }
      );
    }

    setActive(1);
  }

  /* ---------- Feature card value count-up (one-shot when card activates) ---------- */
  function buildValueCountUp() {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    document.querySelectorAll('.feature-card-value').forEach(el => {
      const raw = el.textContent.trim();
      const match = raw.match(/(\d+(?:[.,]\d+)?)/);
      if (!match) return;
      const num = parseFloat(match[1].replace(',', '.'));
      if (num === 0 || !isFinite(num)) return;
      const prefix = raw.slice(0, match.index);
      const suffix = raw.slice(match.index + match[0].length);
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            v: num,
            duration: 1.1,
            ease: 'power2.out',
            onUpdate: () => {
              const rounded = num % 1 === 0 ? Math.round(obj.v) : obj.v.toFixed(1);
              el.textContent = prefix + rounded + suffix;
            }
          });
        }
      });
    });
  }

  /* ---------- Mask reveal on italic emphasis ---------- */
  function buildMaskReveal() {
    const ScrollTrigger = window.ScrollTrigger;
    const selectors = '.hero-headline em, .section-h em, .p-title em, .about-headline em, .prints-head em';

    document.querySelectorAll(selectors).forEach(el => {
      if (el.dataset.maskWrapped === '1') return;
      el.dataset.maskWrapped = '1';
      const inner = document.createElement('span');
      inner.className = 'mask-reveal-inner';
      while (el.firstChild) inner.appendChild(el.firstChild);
      el.appendChild(inner);
      el.classList.add('mask-reveal');

      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => el.classList.add('is-in')
      });
    });
  }

  /* ---------- Product image soft parallax ---------- */
  function buildProductParallax() {
    const gsap = window.gsap;
    document.querySelectorAll('[data-parallax-image] img').forEach(img => {
      gsap.fromTo(img,
        { yPercent: -4, scale: 1.04 },
        {
          yPercent: 4, scale: 1, ease: 'none',
          scrollTrigger: { trigger: img.closest('[data-parallax-image]'), start: 'top bottom', end: 'bottom top', scrub: true }
        }
      );
    });
  }

  /* ---------- Generic parallax data hooks ---------- */
  function buildParallax() {
    const gsap = window.gsap;
    document.querySelectorAll('[data-parallax]').forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || 0.2;
      gsap.to(el, {
        yPercent: speed * 30,
        ease: 'none',
        scrollTrigger: { trigger: el, scrub: true, start: 'top bottom', end: 'bottom top' }
      });
    });
    document.querySelectorAll('[data-parallax-text]').forEach(el => {
      const speed = parseFloat(el.dataset.parallaxText) || 0.3;
      gsap.to(el, {
        yPercent: -speed * 40,
        ease: 'none',
        scrollTrigger: { trigger: el, scrub: true, start: 'top bottom', end: 'bottom top' }
      });
    });
  }

  /* ---------- Prints stagger ---------- */
  function buildPrintsReveal() {
    const gsap = window.gsap;
    const cards = document.querySelectorAll('#prints .print-card');
    if (!cards.length) return;
    gsap.from(cards, {
      y: 50, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: '#prints', start: 'top 75%' }
    });
  }

  /* ---------- About accent bar ---------- */
  function buildAboutAccent() {
    const gsap = window.gsap;
    const bar = document.querySelector('#about .about-accent');
    if (!bar) return;
    gsap.fromTo(bar,
      { height: 0 },
      { height: '60px', duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: '#about', start: 'top 70%' } }
    );
  }

  ready(() => {
    waitForGsap(() => {
      bindLenisToScrollTrigger();

      if (isDesktop()) {
        buildHeroBagParallax();
        document.querySelectorAll('[data-feature-scene]').forEach(buildFeatureScene);
      }
      buildValueCountUp();
      buildMaskReveal();
      buildProductParallax();
      buildParallax();
      buildPrintsReveal();
      buildAboutAccent();

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => window.ScrollTrigger.refresh());
      }
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => window.ScrollTrigger.refresh(), 200);
      });
    });
  });
})();
