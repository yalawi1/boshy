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

  /* ── Footer year ── */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
