/* Boshra — gallery filters + lightbox */
(() => {
  "use strict";

  const grid = document.getElementById("ggrid");
  if (!grid) return;
  const items = [...grid.querySelectorAll(".gitem")];
  const chips = [...document.querySelectorAll(".chip")];

  /* ── Filter ── */
  const applyFilter = (slug) => {
    chips.forEach((c) => c.classList.toggle("is-active", c.dataset.brand === slug));
    items.forEach((it) => {
      it.classList.toggle("is-hidden", slug !== "all" && it.dataset.brand !== slug);
    });
    // keep the URL shareable without reloading
    const url = slug === "all" ? location.pathname : `?b=${slug}`;
    history.replaceState(null, "", url);
  };

  chips.forEach((chip) =>
    chip.addEventListener("click", () => applyFilter(chip.dataset.brand))
  );

  // deep link: gallery.html?b=slug
  const param = new URLSearchParams(location.search).get("b");
  applyFilter(param && chips.some((c) => c.dataset.brand === param) ? param : "all");

  /* ── Lightbox ── */
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCap = document.getElementById("lbCap");
  let current = 0;

  const visibleItems = () => items.filter((it) => !it.classList.contains("is-hidden"));

  const openAt = (item) => {
    const vis = visibleItems();
    current = Math.max(0, vis.indexOf(item));
    const img = vis[current].querySelector("img");
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = vis[current].dataset.name || "";
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
  const step = (dir) => {
    const vis = visibleItems();
    current = (current + dir + vis.length) % vis.length;
    openAt(vis[current]);
  };
  const close = () => {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  items.forEach((it) => it.addEventListener("click", () => openAt(it)));
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
