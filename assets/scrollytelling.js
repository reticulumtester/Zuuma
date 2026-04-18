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

    // Bag scales down + drifts up as hero exits — reads as a handoff
    // to the first feature-visual in the next section. No opacity fade
    // (reads as accidental against a mismatched background).
    gsap.to(stage, {
      yPercent: -18,
      scale: 0.88,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    // First feature-visual of #bag-features enters slightly oversized,
    // settles to 1.0 as the section arrives — visually "catches" the hero bag.
    const firstVisual = document.querySelector(
      '#bag-features [data-feature-visual="1"]'
    );
    if (firstVisual) {
      gsap.fromTo(firstVisual,
        { scale: 1.08 },
        {
          scale: 1, ease: 'none',
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

  /* ---------- Word-split headline reveals (scroll-in, per-word y + blur + fade) ---------- */
  function splitWordsInto(el) {
    // Walk children; wrap every text-node word in .zm-word > .zm-word-inner.
    // Preserves inline tags (like <em>) so italics still work.
    const words = [];
    function walk(node) {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (child.nodeType === 3) {
          const text = child.nodeValue;
          if (!text) continue;
          const frag = document.createDocumentFragment();
          const parts = text.split(/(\s+)/);
          parts.forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
            } else {
              const w = document.createElement('span');
              w.className = 'zm-word';
              const inner = document.createElement('span');
              inner.className = 'zm-word-inner';
              inner.textContent = part;
              w.appendChild(inner);
              frag.appendChild(w);
              words.push(inner);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          if (child.tagName === 'BR') continue;
          walk(child);
        }
      }
    }
    walk(el);
    return words;
  }

  function buildHeadlineReveals() {
    const selectors = [
      '.hero-headline',
      '.section-h',
      '.about-headline',
      '.p-title',
      '.prints-head h2',
      '.media-line',
      '.studio-page-h',
      '.print-pdp-title'
    ].join(', ');

    const gsap = window.gsap;
    if (!gsap) return; // no GSAP => leave text untouched; .reveal + IO handles visibility

    document.querySelectorAll(selectors).forEach(el => {
      if (el.dataset.zmSplit === '1') return;
      el.dataset.zmSplit = '1';
      el.classList.add('zm-split');
      const words = splitWordsInto(el);
      if (!words.length) return;

      // Hide via inline style. Pure JS — if anything below fails, words stay visible.
      gsap.set(words, { yPercent: 110, opacity: 0, filter: 'blur(10px)' });

      let revealed = false;
      const reveal = () => {
        if (revealed) return;
        revealed = true;
        el.classList.add('is-in');
        gsap.to(words, {
          yPercent: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 1.05,
          ease: 'power3.out',
          stagger: 0.045,
          overwrite: 'auto'
        });
      };

      // Primary trigger: IntersectionObserver (fires reliably on scroll-in AND on load
      // if the element is already in view).
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              reveal();
              io.disconnect();
            }
          });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
        io.observe(el);
      } else {
        reveal();
      }

      // Safety net: force reveal after 4s so nothing ever stays permanently hidden.
      setTimeout(reveal, 4000);
    });
  }

  /* ---------- Product image scroll-driven zoom + parallax ---------- */
  function buildProductParallax() {
    const gsap = window.gsap;
    document.querySelectorAll('[data-parallax-image] img').forEach(img => {
      gsap.fromTo(img,
        { yPercent: -6, scale: 1.12 },
        {
          yPercent: 6, scale: 1, ease: 'none',
          scrollTrigger: { trigger: img.closest('[data-parallax-image]'), start: 'top bottom', end: 'bottom top', scrub: 0.6 }
        }
      );
    });
  }

  /* ---------- Hero bag clip-path entrance (load-time cinematic reveal) ---------- */
  function buildHeroEntrance() {
    const gsap = window.gsap;
    const stage = document.querySelector('[data-bag-stage]');
    if (!stage) return;
    const img = stage.querySelector('img');
    if (!img) return;

    const number = document.querySelector('.hero-number-bg');
    const run = () => {
      gsap.fromTo(stage,
        { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.06, opacity: 1 },
        { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.4, ease: 'expo.out' }
      );
      if (number) {
        gsap.fromTo(number,
          { opacity: 0, letterSpacing: '0.4em' },
          { opacity: 1, letterSpacing: '0em', duration: 1.6, ease: 'power3.out', delay: 0.35 }
        );
      }
    };

    if (img.complete) run();
    else img.addEventListener('load', run, { once: true });
  }

  /* ---------- Character-by-character reveal (the about quote) ---------- */
  function splitCharsInto(el) {
    const chars = [];
    function walk(node) {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (child.nodeType === 3) {
          const text = child.nodeValue;
          if (!text) continue;
          const frag = document.createDocumentFragment();
          // Split into words to preserve wrapping, then chars inside each word.
          const parts = text.split(/(\s+)/);
          parts.forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            const wordSpan = document.createElement('span');
            wordSpan.className = 'zm-char-word';
            for (const ch of part) {
              const c = document.createElement('span');
              c.className = 'zm-char';
              c.textContent = ch;
              wordSpan.appendChild(c);
              chars.push(c);
            }
            frag.appendChild(wordSpan);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      }
    }
    walk(el);
    return chars;
  }

  function buildCharReveals() {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    document.querySelectorAll('.about-quote').forEach(el => {
      if (el.dataset.zmChars === '1') return;
      el.dataset.zmChars = '1';
      el.classList.add('zm-chars');
      const chars = splitCharsInto(el);
      if (!chars.length) return;

      if (!gsap) return; // CSS leaves text visible by default

      gsap.set(chars, { opacity: 0, y: '0.4em', filter: 'blur(6px)' });

      let revealed = false;
      const reveal = () => {
        if (revealed) return;
        revealed = true;
        gsap.to(chars, {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: 0.9, ease: 'power3.out',
          stagger: { each: 0.012, from: 'start' },
          overwrite: 'auto'
        });
      };

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              reveal();
              io.disconnect();
            }
          });
        }, { threshold: 0.1 });
        io.observe(el);
      } else {
        reveal();
      }

      setTimeout(reveal, 4000);
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

  /* ---------- Prints stagger ----------
     Cards already carry the .reveal class, handled by the resilient
     IntersectionObserver in theme.js — a GSAP 'from' here was leaving
     cards at opacity:0 if ScrollTrigger hadn't fired yet. No-op now. */
  function buildPrintsReveal() {
    return;
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
      buildHeroEntrance();
      buildValueCountUp();
      buildHeadlineReveals();
      buildCharReveals();
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
