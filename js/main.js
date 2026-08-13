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

  /* ── Password gate (client-side; deters casual visitors only) ── */
  const gate = document.getElementById("gate");
  const GATE_HASH = "70260742c2952154c84e2ea9f68b1a7397f49b6d343da1ed284093c0bd72c742";
  const sha256 = async (text) => {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  };
  const unlocked = sessionStorage.getItem("boshra-gate") === "open";

  const armPreloader = () => {
    window.addEventListener("load", () => setTimeout(reveal, 700));
    if (document.readyState === "complete") setTimeout(reveal, 700);
    // Safety net: never leave the preloader up if `load` is delayed.
    setTimeout(reveal, 3000);
  };

  if (!gate || unlocked || !window.isSecureContext) {
    // crypto.subtle needs a secure context (https / localhost); fail open
    if (gate) gate.remove();
    armPreloader();
  } else {
    gate.hidden = false;
    document.getElementById("preloader")?.classList.add("is-done");
    const input = document.getElementById("gateInput");
    const error = document.getElementById("gateError");
    setTimeout(() => input.focus(), 400);
    document.getElementById("gateForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      gate.classList.remove("is-wrong");
      if ((await sha256(input.value.trim())) === GATE_HASH) {
        sessionStorage.setItem("boshra-gate", "open");
        gate.classList.add("is-open");
        error.textContent = "";
        reveal();
        setTimeout(() => gate.remove(), 900);
      } else {
        error.textContent = "Wrong password — try again";
        input.value = "";
        // restart the shake animation
        requestAnimationFrame(() => gate.classList.add("is-wrong"));
      }
    });
  }

  /* ── Header: glass on scroll, hide on scroll-down ── */
  const header = document.getElementById("header");
  const isSubpage = document.body.classList.contains("subpage");
  let lastY = 0;
  if (header) {
    addEventListener("scroll", () => {
      const y = scrollY;
      header.classList.toggle("is-scrolled", isSubpage || y > 40);
      header.classList.toggle("is-hidden", y > 300 && y > lastY);
      lastY = y;
    }, { passive: true });
  }

  /* ── Mobile nav ── */
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  if (burger && nav) {
    const setNav = (open) => {
      burger.classList.toggle("is-open", open);
      nav.classList.toggle("is-open", open);
      header?.classList.toggle("is-nav-open", open);
      burger.setAttribute("aria-expanded", String(open));
      // lock the page behind the overlay
      document.body.style.overflow = open ? "hidden" : "";
    };
    const closeNav = () => setNav(false);

    burger.addEventListener("click", () => setNav(!nav.classList.contains("is-open")));
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
    addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });
    // a resize past the breakpoint should never leave the overlay stuck open
    addEventListener("resize", () => { if (innerWidth > 900) closeNav(); });
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
  // Fallback: if the observer never fires (old/broken browsers), show everything.
  setTimeout(() => {
    if (!document.querySelector(".reveal.is-visible")) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
    }
  }, 1600);

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
        const url = card.dataset.url;
        if (!url) return;
        if (url.startsWith("http")) open(url, "_blank", "noopener");
        else location.href = url; // internal page (gallery)
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
      // Fallback: if the observer never fires, animate whenever on screen.
      setTimeout(() => {
        if (playing) return;
        const r = canvas.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight) { playing = true; rafId = requestAnimationFrame(loop); }
      }, 2200);
    }
  }

  /* ── Scroll progress bar (interiors page) ── */
  const progress = document.getElementById("progress");
  if (progress) {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
    };
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
  }

  /* ── Project shots: show a placeholder if a drawing is not in the repo yet ── */
  document.querySelectorAll(".shot img").forEach((img) => {
    const fail = () => {
      const fig = img.closest(".shot");
      fig.classList.add("is-missing");
      fig.dataset.placeholder = "Drawing coming soon";
    };
    img.addEventListener("error", fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });

  /* ── Fusion collage: gentle parallax float on scroll ── */
  const floats = [...document.querySelectorAll("[data-float]")];
  if (floats.length && !prefersReduced && matchMedia("(min-width: 641px)").matches) {
    let ticking = false;
    const move = () => {
      const mid = innerHeight / 2;
      floats.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const offset = (r.top + r.height / 2 - mid) * parseFloat(el.dataset.float);
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
      ticking = false;
    };
    addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(move); }
    }, { passive: true });
    move();
  }

  /* ── Project intake form (legacy in-page form, if present) ── */
  const form = document.getElementById("intakeForm");
  if (form) {
    const note = document.getElementById("formNote");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const name = (d.get("name") || "").toString().trim();
      if (!name) {
        note.textContent = "Please add your name first.";
        note.classList.remove("is-ok");
        form.querySelector('[name="name"]').focus();
        return;
      }
      const line = (label, key) => {
        const v = (d.get(key) || "").toString().trim();
        return v ? `${label}: ${v}\n` : "";
      };
      const brief =
        `Project enquiry for Boshra\n\n` +
        line("Name", "name") +
        line("Company", "company") +
        line("Project type", "type") +
        line("Space size", "size") +
        line("Location", "location") +
        line("Timeline", "timeline") +
        line("Brief", "brief");

      try {
        await navigator.clipboard.writeText(brief);
        note.textContent = "Brief copied. Instagram is opening, just paste and send.";
      } catch {
        note.textContent = "Instagram is opening, paste your details into the chat.";
      }
      note.classList.add("is-ok");
      open("https://ig.me/m/boshrahijazy", "_blank", "noopener");
    });
  }

  /* ── Footer year ── */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
