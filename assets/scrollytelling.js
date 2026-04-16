/* Zuuma — scrollytelling
   GSAP + ScrollTrigger scenes. Keeps pins shallow and transitions tasteful.
   - Scene 1: hero bag has upward parallax + subtle scale as you scroll out of hero
   - Scene 2: features-stage bag enters from below with crossfade + settle, callouts draw in, feature items activate
   - Scene 3: specs count up on reveal
   - Scene 4: media watermark / bg parallax
   - Scene 5: apron mirrors bag features (no hero morph — section stands on its own)
   - Scene 6: prints stagger in
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

  /* ---------- Hero bag parallax out ---------- */
  function buildHeroBagParallax() {
    const stage = document.querySelector('.hero-pin [data-bag-stage]');
    if (!stage) return;
    const gsap = window.gsap;
    gsap.to(stage, {
      yPercent: -14,
      scale: 1.06,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }

  /* ---------- Features stage bag enters + settles ---------- */
  function buildFeaturesBagEntry(sectionId) {
    const section = document.querySelector(`#${sectionId}`);
    if (!section) return;
    const stage = section.querySelector('.features-stage');
    const image = section.querySelector('.features-stage-image img');
    if (!stage || !image) return;
    const gsap = window.gsap;
    gsap.fromTo(
      image,
      { scale: 1.12, yPercent: 8, opacity: 0.5 },
      {
        scale: 1,
        yPercent: 0,
        opacity: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          end: 'top 25%',
          scrub: 0.8
        }
      }
    );
  }

  /* ---------- Callouts ---------- */
  function buildCallouts(sceneSelector) {
    const scene = document.querySelector(sceneSelector);
    if (!scene) return;
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    const items = scene.querySelectorAll('.feature-item');
    const dots = scene.querySelectorAll('.callout-dot');
    const lines = scene.querySelectorAll('.callout-line');
    if (!items.length) return;

    // Rebuild each line so it draws from image center (50,50) toward the dot
    lines.forEach(line => {
      const x = parseFloat(line.getAttribute('x1'));
      const y = parseFloat(line.getAttribute('y1'));
      line.setAttribute('x1', '50');
      line.setAttribute('y1', '50');
      line.setAttribute('x2', x);
      line.setAttribute('y2', y);
      line.style.pathLength = '1';
      line.style.strokeDasharray = '1';
      line.style.strokeDashoffset = '1';
      line.style.opacity = '0';
    });

    dots.forEach(d => gsap.set(d, { opacity: 0, scale: 0.3 }));
    items.forEach(i => i.classList.remove('is-active'));

    const total = items.length;
    ScrollTrigger.create({
      trigger: scene,
      start: 'top 60%',
      end: 'bottom 80%',
      scrub: false,
      onUpdate: (self) => {
        const p = self.progress;
        const active = Math.min(total - 1, Math.floor(p * (total + 0.2)));
        items.forEach((item, i) => item.classList.toggle('is-active', i <= active));
        dots.forEach((dot, i) => {
          const show = i <= active;
          gsap.to(dot, { opacity: show ? 1 : 0, scale: show ? 1 : 0.3, duration: 0.4, overwrite: 'auto' });
        });
        lines.forEach((line, i) => {
          const show = i <= active;
          gsap.to(line, { strokeDashoffset: show ? 0 : 1, opacity: show ? 1 : 0, duration: 0.6, overwrite: 'auto' });
        });
      }
    });
  }

  /* ---------- Spec count-up ---------- */
  function buildSpecCountUp() {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    document.querySelectorAll('.specs-grid .s-val').forEach(el => {
      const raw = el.textContent.trim();
      const match = raw.match(/(\d+(?:\.\d+)?)/);
      if (!match) return;
      const num = parseFloat(match[1]);
      if (num === 0) return;
      const prefix = raw.slice(0, match.index);
      const suffix = raw.slice(match.index + match[0].length);
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            v: num,
            duration: 1.1,
            ease: 'power2.out',
            onUpdate: () => {
              const rounded = num >= 100 ? Math.round(obj.v) : obj.v.toFixed(num % 1 === 0 ? 0 : 1);
              el.textContent = prefix + rounded + suffix;
            },
            onComplete: () => { el.textContent = raw; }
          });
        }
      });
    });
  }

  /* ---------- Parallax ---------- */
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
      y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: '#prints', start: 'top 75%' }
    });
  }

  ready(() => {
    waitForGsap(() => {
      bindLenisToScrollTrigger();

      if (isDesktop()) {
        buildHeroBagParallax();
        buildFeaturesBagEntry('bag-features');
        buildFeaturesBagEntry('apron-features');
      }
      buildCallouts('#bag-features');
      buildCallouts('#apron-features');
      buildSpecCountUp();
      buildParallax();
      buildPrintsReveal();

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
