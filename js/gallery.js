/* Boshra — gallery filters, project shots, shared lightbox */
(() => {
  "use strict";

  const grid = document.getElementById("ggrid");
  const items = grid ? [...grid.querySelectorAll(".gitem")] : [];

  /* ── Filter: All chip + dropdown ── */
  const allChip = document.querySelector('.chip[data-brand="all"]');
  const filter = document.getElementById("filter");
  const filterBtn = document.getElementById("filterBtn");
  const filterLabel = document.getElementById("filterLabel");
  const opts = [...document.querySelectorAll(".filter__opt")];

  const closeMenu = () => {
    filter?.classList.remove("is-open");
    filterBtn?.setAttribute("aria-expanded", "false");
  };

  const applyFilter = (slug) => {
    const opt = opts.find((o) => o.dataset.brand === slug);
    allChip?.classList.toggle("is-active", slug === "all");
    opts.forEach((o) => o.setAttribute("aria-selected", String(o === opt)));
    if (filterLabel) filterLabel.textContent = opt ? opt.textContent : "Filter by brand";
    filterBtn?.classList.toggle("is-active", slug !== "all");

    items.forEach((it) => {
      it.classList.toggle("is-hidden", slug !== "all" && it.dataset.brand !== slug);
    });
    history.replaceState(null, "", slug === "all" ? location.pathname : `?b=${slug}`);
    closeMenu();
  };

  if (filterBtn) {
    filterBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = !filter.classList.contains("is-open");
      filter.classList.toggle("is-open", open);
      filterBtn.setAttribute("aria-expanded", String(open));
    });
    opts.forEach((o) => o.addEventListener("click", () => applyFilter(o.dataset.brand)));
    allChip?.addEventListener("click", () => applyFilter("all"));
    addEventListener("click", (e) => { if (!filter.contains(e.target)) closeMenu(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

    // deep link: gallery.html?b=slug
    const param = new URLSearchParams(location.search).get("b");
    applyFilter(param && opts.some((o) => o.dataset.brand === param) ? param : "all");
  }

  /* ── Lightbox: gallery items or project shots ── */
  const lb = document.getElementById("lightbox");
  if (!lb) return;
  const lbImg = document.getElementById("lbImg");
  const lbCap = document.getElementById("lbCap");
  const shots = [...document.querySelectorAll(".shot")];
  const sources = items.length ? items : shots;
  if (!sources.length) return;

  let current = 0;
  const visible = () =>
    sources.filter((el) => !el.classList.contains("is-hidden") && !el.classList.contains("is-missing"));

  const openAt = (el) => {
    const vis = visible();
    current = Math.max(0, vis.indexOf(el));
    const target = vis[current];
    if (!target) return;
    const img = target.querySelector("img");
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent =
      target.dataset.name || target.querySelector("figcaption")?.textContent.trim() || "";
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
  const step = (dir) => {
    const vis = visible();
    if (!vis.length) return;
    current = (current + dir + vis.length) % vis.length;
    openAt(vis[current]);
  };
  const close = () => {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  sources.forEach((el) =>
    el.addEventListener("click", () => {
      if (!el.classList.contains("is-missing")) openAt(el);
    })
  );
  document.getElementById("lbClose").addEventListener("click", close);
  document.getElementById("lbPrev").addEventListener("click", () => step(-1));
  document.getElementById("lbNext").addEventListener("click", () => step(1));
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
})();
