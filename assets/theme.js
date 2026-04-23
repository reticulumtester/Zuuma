/* Zuuma — base theme JS
   Handles: Lenis smooth scroll, reveal observer, FAQ accordion, header scroll state, cart helpers.
   Scrollytelling (GSAP scenes) lives in scrollytelling.js and reads window.ZuumaMotion.
*/
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.ZuumaMotion = {
    reduceMotion,
    scrollytelling: document.documentElement.dataset.scrollytelling !== 'false' && !reduceMotion,
    smoothScroll: document.documentElement.dataset.smoothScroll !== 'false' && !reduceMotion,
    lenis: null
  };

  function initLenis() {
    if (!window.ZuumaMotion.smoothScroll) return;
    if (typeof window.Lenis !== 'function') return;
    const lenis = new window.Lenis({
      duration: 1.1,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1
    });
    window.ZuumaMotion.lenis = lenis;
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Smooth-scroll in-page anchors. Also catches "/#foo" links (from
    // header/footer, which use that form so they work from subpages too) —
    // on the homepage we intercept and smooth-scroll; off-homepage we let
    // the browser navigate to / and the hash jumps naturally after load.
    document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach(a => {
      a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if (!href || href === '#' || href === '/#') return;

        const isRooted = href.startsWith('/#');
        const onHomepage = window.location.pathname === '/' || window.location.pathname === '';
        if (isRooted && !onHomepage) return; // let the browser load home + jump

        const selector = isRooted ? href.slice(1) : href;
        const target = document.querySelector(selector);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -96, duration: 1.2 });
        // Keep URL clean-ish on homepage for back-button sanity
        if (isRooted && history.replaceState) {
          history.replaceState(null, '', selector);
        }
      });
    });

    document.dispatchEvent(new CustomEvent('zuuma:lenis-ready', { detail: { lenis } }));
  }

  function initReveals() {
    const targets = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(el => io.observe(el));

    // Hero visible instantly
    setTimeout(() => {
      document.querySelectorAll('#hero .reveal').forEach(el => el.classList.add('in'));
    }, 120);
  }

  // (previous hero-signature fallback removed — hero no longer has chapter marker,
  // draw-in divider, tracking eyebrow, or glint button. Scroll cue fade-in is
  // handled directly by initScrollCue.)

  function initFaq() {
    document.querySelectorAll('.qa-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.qa-item');
        if (!item) return;
        const wasOpen = item.classList.contains('open');
        item.parentElement.querySelectorAll('.qa-item.open').forEach(i => i.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
      });
    });
  }

  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initScrollCue() {
    const cue = document.querySelector('[data-scroll-cue]');
    if (!cue) return;
    // Surface the cue reliably, regardless of GSAP / scrollytelling state.
    setTimeout(() => cue.classList.add('is-in'), 900);

    const dismiss = () => cue.classList.add('is-gone');
    const threshold = () => Math.min(120, window.innerHeight * 0.12);
    const onScroll = () => {
      if (window.scrollY > threshold()) {
        dismiss();
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    cue.addEventListener('click', dismiss);
  }

  function initAccentBar() {
    const bars = document.querySelectorAll('.about-accent-bar');
    if (!bars.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    bars.forEach(b => io.observe(b));
  }

  function initAddToCart() {
    document.querySelectorAll('[data-add-to-cart]').forEach(form => {
      form.addEventListener('submit', async e => {
        const variantId = form.dataset.variantId;
        if (!variantId) return; // falls back to link
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        try {
          const res = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] })
          });
          if (!res.ok) throw new Error('cart add failed');
          window.location.href = '/cart';
        } catch (err) {
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Try again';
          }
        }
      });
    });
  }

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(() => {
    initLenis();
    initReveals();
    initFaq();
    initHeaderScroll();
    initScrollCue();
    initAccentBar();
    initAddToCart();
  });
})();
