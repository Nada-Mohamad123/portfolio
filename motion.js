/* ============================================================
   Nada Mohamed Sayed — Portfolio
   MOTION LAYER  (loaded after script.js)
   ------------------------------------------------------------
   Everything here is progressive enhancement: if this file fails
   to load, the site still works exactly as before.
   ============================================================ */
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* ==========================================================
     1. SCROLL PROGRESS BAR
     ========================================================== */
  const bar = document.getElementById('scrollProgress');
  if (bar) {
    const updateBar = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = `scaleX(${p})`;
    };
    window.addEventListener('scroll', updateBar, { passive: true });
    window.addEventListener('resize', updateBar);
    updateBar();
  }

  /* ==========================================================
     2. GLOBAL POINTER TRACKING
     Shared by: cursor glow, hero canvas, tilt, chip parallax
     ========================================================== */
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false };

  if (!isTouch) {
    window.addEventListener('mousemove', (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    }, { passive: true });
  }

  /* ==========================================================
     3. CURSOR GLOW + TRAILING DOT
     ========================================================== */
  if (!isTouch && !reduced) {
    const glow = document.getElementById('cursorGlow');
    const dot = document.getElementById('cursorDot');

    if (glow && dot) {
      let gx = pointer.x, gy = pointer.y;   // slow, heavy glow
      let dx = pointer.x, dy = pointer.y;   // fast, light dot

      const raf = () => {
        gx = lerp(gx, pointer.x, 0.075);
        gy = lerp(gy, pointer.y, 0.075);
        dx = lerp(dx, pointer.x, 0.28);
        dy = lerp(dy, pointer.y, 0.28);
        glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
        dot.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        requestAnimationFrame(raf);
      };
      raf();

      window.addEventListener('mouseenter', () => {
        glow.classList.add('on');
        dot.classList.add('on');
      });
      document.addEventListener('mousemove', () => {
        glow.classList.add('on');
        dot.classList.add('on');
      }, { once: true });

      // the dot expands over anything clickable
      const hoverables = 'a, button, .badge, .tech-tag, .project-card, .service-card, .skill-card, .highlight-card, .cert-card, input, textarea';
      document.querySelectorAll(hoverables).forEach(el => {
        el.addEventListener('mouseenter', () => dot.classList.add('big'));
        el.addEventListener('mouseleave', () => dot.classList.remove('big'));
      });
    }
  }

  /* ==========================================================
     4. SITE-WIDE NODE NETWORK  (the software-engineering visual)
     A fixed canvas behind every section. Nodes = services, lines =
     connections, dots = data packets travelling between them. Nearby
     nodes drift toward the cursor and light up.
     ========================================================== */
  const canvas = document.getElementById('bgNet');

  if (canvas && !reduced) {
    const ctx = canvas.getContext('2d');
    const root = document.documentElement;
    let W = 0, H = 0, dpr = 1;
    let nodes = [];
    let packets = [];
    let rgb = '49,229,224';
    let boost = 1;                  // lines/nodes need a little more weight on a light background

    const CONNECT_DIST = 150;
    const MOUSE_DIST = 190;

    function readTheme() {
      const v = getComputedStyle(root).getPropertyValue('--cyan-rgb').trim();
      if (v) rgb = v;
      boost = root.getAttribute('data-theme') === 'light' ? 1.35 : 1;
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      const density = Math.round(clamp((W * H) / 22000, 24, 72));
      nodes = Array.from({ length: density }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 1.1,
        hub: Math.random() < 0.14      // a few nodes are "services": bigger and square
      }));
      packets = [];
    }

    function spawnPacket() {
      if (nodes.length < 2 || packets.length > 9) return;
      const a = (Math.random() * nodes.length) | 0;
      const b = (Math.random() * nodes.length) | 0;
      if (a === b) return;
      const d = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
      if (d > CONNECT_DIST * 1.5) return;
      packets.push({ a, b, t: 0, speed: 0.006 + Math.random() * 0.01 });
    }

    function draw() {
      if (document.hidden) return requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);

      const mx = pointer.x, my = pointer.y;
      const mouseInside = pointer.active;

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        n.x = clamp(n.x, 0, W);
        n.y = clamp(n.y, 0, H);

        if (mouseInside) {
          const d = Math.hypot(n.x - mx, n.y - my);
          if (d < MOUSE_DIST && d > 1) {
            const pull = (1 - d / MOUSE_DIST) * 0.45;
            n.x -= ((n.x - mx) / d) * pull;
            n.y -= ((n.y - my) / d) * pull;
          }
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > CONNECT_DIST) continue;
          ctx.strokeStyle = `rgba(${rgb},${(1 - d / CONNECT_DIST) * 0.26 * boost})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      if (mouseInside) {
        for (const n of nodes) {
          const d = Math.hypot(n.x - mx, n.y - my);
          if (d > MOUSE_DIST) continue;
          ctx.strokeStyle = `rgba(${rgb},${(1 - d / MOUSE_DIST) * 0.5 * boost})`;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();
        }
      }

      for (const n of nodes) {
        const near = mouseInside && Math.hypot(n.x - mx, n.y - my) < MOUSE_DIST;
        ctx.fillStyle = `rgba(${rgb},${near ? 0.95 : 0.5 * boost})`;
        if (n.hub) {
          const s = n.r * 2.4;
          ctx.fillRect(n.x - s / 2, n.y - s / 2, s, s);
          ctx.strokeStyle = `rgba(${rgb},${0.32 * boost})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(n.x - s, n.y - s, s * 2, s * 2);
        } else {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (Math.random() < 0.035) spawnPacket();
      packets = packets.filter(p => p.t <= 1);
      for (const p of packets) {
        const a = nodes[p.a], b = nodes[p.b];
        if (!a || !b) { p.t = 2; continue; }
        p.t += p.speed;
        const x = lerp(a.x, b.x, p.t);
        const y = lerp(a.y, b.y, p.t);
        const fade = Math.sin(p.t * Math.PI);
        ctx.fillStyle = `rgba(${rgb},${Math.min(1, fade * boost)})`;
        ctx.beginPath();
        ctx.arc(x, y, 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(${rgb},${fade * 0.35 * boost})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(lerp(a.x, b.x, Math.max(0, p.t - 0.06)), lerp(a.y, b.y, Math.max(0, p.t - 0.06)));
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      requestAnimationFrame(draw);
    }

    readTheme();
    resize();
    let rT;
    window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(resize, 150); });
    window.addEventListener('themechange', readTheme);
    draw();
  }

  /* ==========================================================
     5. MOUSE PARALLAX — code chips + portrait tilt
     ========================================================== */
  if (!isTouch && !reduced) {
    const chips = Array.from(document.querySelectorAll('.code-chip'));
    const frame = document.querySelector('.hero-frame');
    const heroText = document.querySelector('.hero-text');
    let tx = 0, ty = 0;

    const tick = () => {
      const nx = (pointer.x / window.innerWidth) - 0.5;   // -0.5 → 0.5
      const ny = (pointer.y / window.innerHeight) - 0.5;
      tx = lerp(tx, nx, 0.06);
      ty = lerp(ty, ny, 0.06);

      chips.forEach((chip, i) => {
        const depth = 14 + (i % 3) * 12;                  // layered depth
        chip.style.transform = `translate3d(${-tx * depth}px, ${-ty * depth}px, 0)`;
      });

      if (frame) {
        frame.style.transform =
          `perspective(900px) rotateY(${tx * 13}deg) rotateX(${-ty * 13}deg) translate3d(${tx * 14}px, ${ty * 14}px, 0)`;
      }
      if (heroText) {
        heroText.style.setProperty('--px', `${-tx * 8}px`);
      }
      requestAnimationFrame(tick);
    };
    tick();
  }

  /* ==========================================================
     6. MAGNETIC BUTTONS
     ========================================================== */
  if (!isTouch && !reduced) {
    document.querySelectorAll('.btn, .social-circle').forEach(el => {
      el.classList.add('magnetic');
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2;
        const my = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${mx * 0.28}px, ${my * 0.32}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ==========================================================
     7. CARD SPOTLIGHT (light follows the cursor inside a card)
     ========================================================== */
  const spotSelector = '.project-card, .service-card, .project-featured, .skill-card, .highlight-card, .cert-card, .timeline-card, .edu-panel, .activity-card, .lang-card';
  document.querySelectorAll(spotSelector).forEach(card => {
    card.classList.add('spotlight');
    if (isTouch) return;
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ==========================================================
     8. SCROLL REVEAL — directions + stagger
     script.js already adds .in via IntersectionObserver;
     here we only decide HOW each element arrives.
     ========================================================== */
  if (!reduced) {
    // stagger: siblings inside the same grid arrive one after another
    const groups = ['.project-grid', '.service-grid', '.skills-grid', '.cert-grid', '.highlight-grid', '.act-lang-grid'];
    groups.forEach(sel => {
      document.querySelectorAll(sel).forEach(parent => {
        parent.querySelectorAll(':scope > .reveal').forEach((el, i) => {
          el.style.transitionDelay = `${i * 90}ms`;
        });
      });
    });

    // directional variety
    document.querySelectorAll('.about-copy').forEach(el => el.classList.add('from-left'));
    document.querySelectorAll('.highlight-grid').forEach(el => el.classList.add('from-right'));
    document.querySelectorAll('.contact-info').forEach(el => el.classList.add('from-left'));
    document.querySelectorAll('.contact-form').forEach(el => el.classList.add('from-right'));
    document.querySelectorAll('.skill-card, .service-card').forEach(el => el.classList.add('from-zoom'));
    document.querySelectorAll('.project-grid > .reveal').forEach((el, i) => {
      el.classList.add(i % 2 === 0 ? 'from-left' : 'from-right');
    });
    document.querySelectorAll('.cert-grid > .reveal').forEach(el => el.classList.add('from-zoom'));
  }

  /* ==========================================================
     9. COUNT-UP NUMBERS (GPA)
     ========================================================== */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        countObserver.unobserve(el);
        const target = parseFloat(el.dataset.count);
        const decimals = (el.dataset.count.split('.')[1] || '').length;
        if (reduced) { el.textContent = target.toFixed(decimals); return; }
        const dur = 1400;
        const start = performance.now();
        const step = (now) => {
          const t = clamp((now - start) / dur, 0, 1);
          const eased = 1 - Math.pow(1 - t, 3);   // ease-out cubic
          el.textContent = (target * eased).toFixed(decimals);
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    counters.forEach(el => countObserver.observe(el));
  }

  /* ==========================================================
     10. TYPEWRITER — rotating job titles
     ========================================================== */
  const typeTarget = document.getElementById('typeTarget');
  if (typeTarget) {
    const roles = JSON.parse(typeTarget.dataset.roles || '[]');
    if (roles.length === 1) {
      // one title only: type it once, then let the caret keep blinking
      const word = roles[0];
      if (reduced) { typeTarget.textContent = word; }
      else {
        typeTarget.textContent = '';
        let i = 0;
        const typeOnce = () => {
          i += 1;
          typeTarget.textContent = word.slice(0, i);
          if (i < word.length) setTimeout(typeOnce, 85);
        };
        setTimeout(typeOnce, 700);
      }
    } else if (roles.length && !reduced) {
      let r = 0, i = 0, deleting = false;
      const type = () => {
        const word = roles[r];
        i += deleting ? -1 : 1;
        typeTarget.textContent = word.slice(0, i);

        let wait = deleting ? 45 : 85;
        if (!deleting && i === word.length) { wait = 1900; deleting = true; }
        else if (deleting && i === 0) { deleting = false; r = (r + 1) % roles.length; wait = 380; }
        setTimeout(type, wait);
      };
      setTimeout(type, 900);
    } else if (roles.length) {
      typeTarget.textContent = roles[0];
    }
  }

  /* ==========================================================
     11. HERO PARALLAX ON SCROLL
     ========================================================== */
  if (!reduced) {
    const heroText = document.querySelector('.hero-text');
    const heroVisual = document.querySelector('.hero-visual');
    const cue = document.querySelector('.scroll-cue');

    const onScroll = () => {
      const y = window.scrollY;
      if (y > window.innerHeight) return;
      const p = clamp(y / (window.innerHeight * 0.85), 0, 1);
      if (heroText) {
        heroText.style.transform = `translateY(${y * 0.16}px)`;
        heroText.style.opacity = `${1 - p * 0.9}`;
      }
      if (heroVisual) {
        heroVisual.style.transform = `translateY(${y * 0.28}px)`;
        heroVisual.style.opacity = `${1 - p * 0.9}`;
      }
      if (cue) cue.style.opacity = `${1 - p * 2.2}`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ==========================================================
     12. CERTIFICATE FILTERS
     Animated category filtering — cards scale/fade out, the
     remaining ones re-stagger back in.
     ========================================================== */
  const filterBar = document.getElementById('certFilters');
  const certGrid = document.getElementById('certGrid');
  const certEmpty = document.getElementById('certEmpty');

  if (filterBar && certGrid) {
    const cards = Array.from(certGrid.querySelectorAll('.cert-card'));

    const applyFilter = (cat) => {
      const keep = cards.filter(c => cat === 'all' || c.dataset.cat === cat);

      cards.forEach(c => c.classList.add('filtering'));

      setTimeout(() => {
        cards.forEach(c => {
          const visible = keep.includes(c);
          c.classList.toggle('filtered-out', !visible);
        });
        // re-stagger whatever is left on screen
        keep.forEach((c, i) => {
          c.style.transitionDelay = `${i * 60}ms`;
          requestAnimationFrame(() => c.classList.remove('filtering'));
        });
        if (certEmpty) certEmpty.classList.toggle('show', keep.length === 0);
      }, reduced ? 0 : 240);
    };

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.cert-filter');
      if (!btn) return;
      filterBar.querySelectorAll('.cert-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.filter);
    });
  }

  /* ==========================================================
     13. NAV LINK — smooth "ripple" on click (visual feedback)
     ========================================================== */
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      link.animate(
        [{ transform: 'translateY(-2px) scale(1)' }, { transform: 'translateY(-4px) scale(1.08)' }, { transform: 'none' }],
        { duration: 420, easing: 'cubic-bezier(.34,1.4,.64,1)' }
      );
    });
  });

  /* ==========================================================
     14. SITE-WIDE SCROLL EFFECTS
     Drives the drifting background orbs and the slow parallax
     on every project image.
     ========================================================== */
  if (!reduced) {
    const rootEl = document.documentElement;
    const shots = Array.from(document.querySelectorAll('.project-shot img'));
    let ticking = false;

    const update = () => {
      ticking = false;
      rootEl.style.setProperty('--sy', window.scrollY.toFixed(0));
      const vh = window.innerHeight;
      shots.forEach(img => {
        const box = img.parentElement.getBoundingClientRect();
        if (box.bottom < -40 || box.top > vh + 40) return;
        const offset = (box.top + box.height / 2 - vh / 2) * -0.05;
        img.style.setProperty('--py', `${clamp(offset, -6, 6).toFixed(1)}px`);
      });
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ==========================================================
     15. 3D CARD TILT
     Cards lean toward the cursor. Skipped on touch devices.
     ========================================================== */
  if (!isTouch && !reduced) {
    const tiltSel = '.project-card, .service-card, .cert-card, .highlight-card';
    document.querySelectorAll(tiltSel).forEach(card => {
      card.classList.add('tilt');
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          `perspective(900px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg) translateY(-5px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ==========================================================
     16. CURSOR DOT — keep it visible on both themes
     ========================================================== */
  // (the dot and glow read --cyan / --cyan-rgb, so nothing else is needed;
  //  the canvas listens for the 'themechange' event dispatched by script.js)

})();
