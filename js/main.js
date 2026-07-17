/* Boshra Hijazy — portfolio interactions */
(() => {
  "use strict";

  /* ── Preloader ── */
  window.addEventListener("load", () => {
    setTimeout(() => {
      document.getElementById("preloader").classList.add("is-done");
      document.body.classList.add("is-loaded");
    }, 900);
  });

  /* ── Header: glass on scroll, hide on scroll-down ── */
  const header = document.getElementById("header");
  let lastY = 0;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    header.classList.toggle("is-hidden", y > 300 && y > lastY);
    lastY = y;
  }, { passive: true });

  /* ── Mobile nav ── */
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  burger.addEventListener("click", () => {
    burger.classList.toggle("is-open");
    nav.classList.toggle("is-open");
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      burger.classList.remove("is-open");
      nav.classList.remove("is-open");
    })
  );

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

  /* ── Animated counters ── */
  const counterIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = +el.dataset.count;
        const dur = 1400;
        const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        counterIO.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll("[data-count]").forEach((el) => counterIO.observe(el));

  /* ── Gentle parallax ── */
  const parallaxEls = [...document.querySelectorAll("[data-parallax]")];
  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReduced && parallaxEls.length) {
    const update = () => {
      const vh = innerHeight;
      parallaxEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const speed = +el.dataset.parallax;
        const offset = (r.top + r.height / 2 - vh / 2) * speed;
        const img = el.querySelector("img") || el;
        img.style.transform = `translateY(${offset}px) scale(1.12)`;
      });
    };
    addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    update();
  }

  /* ── Lightbox ── */
  const items = [...document.querySelectorAll(".gallery__item")];
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCap = document.getElementById("lbCap");
  let current = 0;

  const openAt = (i) => {
    current = (i + items.length) % items.length;
    const item = items[current];
    lbImg.src = item.querySelector("img").src;
    lbImg.alt = item.querySelector("img").alt;
    lbCap.textContent = item.dataset.caption || "";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  items.forEach((item, i) => item.addEventListener("click", () => openAt(i)));
  document.getElementById("lbClose").addEventListener("click", close);
  document.getElementById("lbPrev").addEventListener("click", () => openAt(current - 1));
  document.getElementById("lbNext").addEventListener("click", () => openAt(current + 1));
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) close(); });
  addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") openAt(current - 1);
    if (e.key === "ArrowRight") openAt(current + 1);
  });

  /* ── Footer year ── */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
