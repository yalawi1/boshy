/* Boshra — Model & Interior Designer · interactions */
(() => {
  "use strict";

  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Always open at the top (ignore browser scroll restoration on reload) */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* ── Preloader ── */
  const reveal = () => {
    document.getElementById("preloader")?.classList.add("is-done");
    document.body.classList.add("is-loaded");
  };
  window.addEventListener("load", () => setTimeout(reveal, 700));
  // Safety net: never leave the preloader up if `load` is delayed.
  setTimeout(reveal, 3000);

  /* ── Header: glass on scroll, hide on scroll-down ── */
  const header = document.getElementById("header");
  let lastY = 0;
  if (header) {
    addEventListener("scroll", () => {
      const y = scrollY;
      header.classList.toggle("is-scrolled", y > 40);
      header.classList.toggle("is-hidden", y > 300 && y > lastY);
      lastY = y;
    }, { passive: true });
  }

  /* ── Mobile nav ── */
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  if (burger && nav) {
    const closeNav = () => {
      burger.classList.remove("is-open");
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    };
    burger.addEventListener("click", () => {
      const open = burger.classList.toggle("is-open");
      nav.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
  }

  /* ── Reveal on scroll (staggered) ── */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = [...el.parentElement.children].filter((c) =>
          c.classList.contains("reveal")
        );
        const idx = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = `${Math.min(idx * 90, 450)}ms`;
        el.classList.add("is-visible");
        io.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ── Brands 3D carousel ── */
  const stage = document.getElementById("carouselStage");
  if (stage) {
    const cards = [...stage.querySelectorAll(".ccard")];
    const dotsBox = document.getElementById("carDots");
    const n = cards.length;
    let current = 0;
    let autoTimer = 0;

    // dots
    const dots = cards.map((_, i) => {
      const d = document.createElement("button");
      d.className = "carousel__dot";
      d.setAttribute("aria-label", `Go to brand ${i + 1}`);
      d.addEventListener("click", () => goTo(i, true));
      dotsBox.appendChild(d);
      return d;
    });

    const layout = () => {
      cards.forEach((card, i) => {
        // shortest signed distance around the ring
        let off = (i - current) % n;
        if (off > n / 2) off -= n;
        if (off < -n / 2) off += n;
        const abs = Math.abs(off);
        const x = off * (stage.clientWidth > 700 ? 46 : 58); // % of card width
        const visible = abs <= 2;
        card.style.transform =
          `translate(-50%, -50%) translateX(${x}%) ` +
          `rotateY(${off * -32}deg) translateZ(${-abs * 130}px)`;
        card.style.opacity = visible ? String(1 - abs * 0.28) : "0";
        card.style.filter = abs ? `brightness(${1 - abs * 0.18})` : "none";
        card.style.zIndex = String(10 - abs);
        card.style.pointerEvents = visible ? "auto" : "none";
        card.classList.toggle("is-active", off === 0);
      });
      dots.forEach((d, i) => d.classList.toggle("is-active", i === current));
    };

    const goTo = (i, user) => {
      current = ((i % n) + n) % n;
      layout();
      if (user) restartAuto();
    };

    const restartAuto = () => {
      clearInterval(autoTimer);
      if (!prefersReduced) autoTimer = setInterval(() => goTo(current + 1), 4500);
    };

    document.getElementById("carPrev").addEventListener("click", () => goTo(current - 1, true));
    document.getElementById("carNext").addEventListener("click", () => goTo(current + 1, true));

    // click: focus a side card, open the centered one
    cards.forEach((card, i) => {
      card.addEventListener("click", () => {
        if (i !== current) return goTo(i, true);
        if (card.dataset.url) open(card.dataset.url, "_blank", "noopener");
      });
    });

    // drag / swipe
    let startX = null;
    stage.addEventListener("pointerdown", (e) => { startX = e.clientX; });
    addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) goTo(current + (dx < 0 ? 1 : -1), true);
    });

    // keyboard when the carousel is in view
    addEventListener("keydown", (e) => {
      const r = stage.getBoundingClientRect();
      if (r.top > innerHeight || r.bottom < 0) return;
      if (e.key === "ArrowLeft") goTo(current - 1, true);
      if (e.key === "ArrowRight") goTo(current + 1, true);
    });

    stage.addEventListener("mouseenter", () => clearInterval(autoTimer));
    stage.addEventListener("mouseleave", restartAuto);

    addEventListener("resize", layout);
    layout();
    restartAuto();
  }

  /* ── 3D tilt cards ── */
  if (!prefersReduced) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      const inner = card.querySelector(".card3d__inner");
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform = `rotateY(${px * 10}deg) rotateX(${py * -10}deg) translateZ(12px)`;
      });
      card.addEventListener("mouseleave", () => {
        inner.style.transform = "rotateY(0deg) rotateX(0deg) translateZ(0)";
      });
    });
  }

  /* ── Hero backdrop drift (subtle parallax on pointer) ── */
  const drift = document.querySelector("[data-drift] img");
  if (drift && !prefersReduced && matchMedia("(pointer: fine)").matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    addEventListener("pointermove", (e) => {
      tx = (e.clientX / innerWidth - 0.5) * 18;
      ty = (e.clientY / innerHeight - 0.5) * 18;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    const step = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      drift.style.transform = `scale(1.12) translate(${cx}px, ${cy}px)`;
      raf = Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1
        ? requestAnimationFrame(step)
        : 0;
    };
  }

  /* ── Interiors: floor plan → furnished home (canvas) ── */
  const canvas = document.getElementById("spaceCanvas");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const W = 460, H = 500;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const CHARCOAL = "#444041", PINK = "#c06183", ROSE = "#d9829b",
          BLUSH = "#eddbe1", GREY = "#b9b5b3", INK = "#292426";

    // wall segments of the plan (outer shell + interior wall with door gap)
    const walls = [
      [60, 70, 400, 70], [400, 70, 400, 430], [400, 430, 60, 430],
      [60, 430, 60, 70],
      [60, 250, 200, 250], [260, 250, 400, 250], // interior wall + door gap
    ];
    const wallLen = walls.reduce((s, w) => s + Math.hypot(w[2] - w[0], w[3] - w[1]), 0);

    const easeOutBack = (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    // each furniture piece: draw(cx-scaled), stagger order
    const furniture = [
      { d: () => { // rug (living room, below wall)
          ctx.fillStyle = BLUSH;
          ctx.beginPath(); ctx.ellipse(230, 345, 95, 52, 0, 0, Math.PI * 2); ctx.fill();
        } },
      { d: () => { // sofa
          ctx.fillStyle = PINK; roundRect(140, 285, 180, 40, 12); ctx.fill();
          ctx.fillStyle = ROSE; roundRect(150, 291, 75, 28, 8); ctx.fill();
          roundRect(235, 291, 75, 28, 8); ctx.fill();
        } },
      { d: () => { // coffee table
          ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(230, 372, 20, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(230, 372, 7, 0, Math.PI * 2); ctx.stroke();
        } },
      { d: () => { // bed (top room)
          ctx.fillStyle = BLUSH; roundRect(90, 100, 110, 120, 10); ctx.fill();
          ctx.fillStyle = ROSE; roundRect(98, 108, 44, 30, 6); ctx.fill();
          roundRect(148, 108, 44, 30, 6); ctx.fill();
          ctx.fillStyle = PINK; roundRect(90, 160, 110, 60, 10); ctx.fill();
        } },
      { d: () => { // dining set (top-right room)
          ctx.fillStyle = INK;
          ctx.beginPath(); ctx.arc(320, 160, 30, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = GREY;
          [[320, 116], [320, 204], [276, 160], [364, 160]].forEach(([x, y]) => {
            ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
          });
        } },
      { d: () => { // plants
          ctx.fillStyle = ROSE;
          ctx.beginPath(); ctx.arc(380, 410, 13, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(80, 90, 0.1, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = PINK;
          ctx.beginPath(); ctx.arc(80, 410, 13, 0, Math.PI * 2); ctx.fill();
        } },
    ];

    const drawGrid = (alpha) => {
      ctx.strokeStyle = `rgba(185, 181, 179, ${0.28 * alpha})`;
      ctx.lineWidth = 1;
      for (let x = 20; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, H - 20); ctx.stroke();
      }
      for (let y = 20; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(W - 20, y); ctx.stroke();
      }
    };

    const drawWalls = (p) => {
      let budget = wallLen * p;
      ctx.strokeStyle = CHARCOAL;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      for (const [x1, y1, x2, y2] of walls) {
        const len = Math.hypot(x2 - x1, y2 - y1);
        if (budget <= 0) break;
        const f = Math.min(1, budget / len);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f);
        ctx.stroke();
        budget -= len;
      }
    };

    const CYCLE = 9000;
    const render = (now) => {
      const t = (now % CYCLE) / CYCLE; // 0..1
      ctx.clearRect(0, 0, W, H);

      // vibrancy glow behind everything once furnished
      const glow = clamp01((t - 0.62) / 0.18) * (1 - clamp01((t - 0.9) / 0.1));
      if (glow > 0) {
        const g = ctx.createRadialGradient(230, 250, 40, 230, 250, 300);
        g.addColorStop(0, `rgba(237, 219, 225, ${0.5 * glow})`);
        g.addColorStop(1, "rgba(237, 219, 225, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      const fadeOut = 1 - clamp01((t - 0.93) / 0.07); // reset softly
      ctx.globalAlpha = fadeOut;

      drawGrid(1 - 0.5 * clamp01((t - 0.3) / 0.2));
      drawWalls(clamp01(t / 0.28));

      // furniture staggers in from t=0.32
      furniture.forEach((f, i) => {
        const p = clamp01((t - 0.32 - i * 0.055) / 0.12);
        if (p <= 0) return;
        const s = easeOutBack(p);
        ctx.save();
        ctx.globalAlpha = fadeOut * p;
        ctx.translate(230, 250);
        ctx.scale(s, s);
        ctx.translate(-230, -250);
        f.d();
        ctx.restore();
      });

      ctx.globalAlpha = 1;
    };

    if (prefersReduced) {
      render(CYCLE * 0.8); // static furnished frame
    } else {
      let playing = false, rafId = 0;
      const loop = (now) => { render(now); rafId = requestAnimationFrame(loop); };
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !playing) { playing = true; rafId = requestAnimationFrame(loop); }
        else if (!e.isIntersecting && playing) { playing = false; cancelAnimationFrame(rafId); }
      }, { threshold: 0.2 }).observe(canvas);
    }
  }

  /* ── Footer year ── */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
