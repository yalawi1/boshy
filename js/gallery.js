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

  let currentSlug = "all";
  const applyFilter = (slug) => {
    currentSlug = slug;
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

  /* ── Encrypted photos ──
     The page ships only 24px blurred placeholders and AES-GCM encrypted files under
     random names. The key comes from the password via PBKDF2; the manifest that maps
     tiles to files is encrypted too, so nothing readable exists before unlocking. */
  const ENC_DIR = "/assets/gallery-enc/";
  const SALT = "boshra-gallery-v1", ITER = 300000;   // must match tools/encrypt-gallery.py
  const te = new TextEncoder();
  const b64enc = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const b64dec = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const deriveKey = async (password) => {
    const base = await crypto.subtle.importKey("raw", te.encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: te.encode(SALT), iterations: ITER, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, true, ["decrypt"]);
  };
  const importKey = (raw) => crypto.subtle.importKey("raw", raw, "AES-GCM", true, ["decrypt"]);
  const fetchDecrypted = async (key, file) => {
    const u = new Uint8Array(await (await fetch(ENC_DIR + file)).arrayBuffer());
    return crypto.subtle.decrypt({ name: "AES-GCM", iv: u.slice(0, 12) }, key, u.slice(12));
  };

  const unlockGrid = async (key) => {
    const manifest = JSON.parse(new TextDecoder().decode(await fetchDecrypted(key, "manifest.bin")));
    manifest.forEach((m, i) => {
      const fig = items[i]; if (!fig) return;
      fig.dataset.brand = m.brand; fig.dataset.name = m.name; fig.dataset.file = m.file;
      fig.querySelector("figcaption").textContent = m.name;
      fig.querySelector("img").alt = m.alt;
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach(async (en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const fig = en.target, img = fig.querySelector("img");
        try {
          const buf = await fetchDecrypted(key, fig.dataset.file);
          img.onload = () => fig.classList.remove("is-locked");
          img.removeAttribute("aria-hidden");
          img.src = URL.createObjectURL(new Blob([buf], { type: "image/jpeg" }));
        } catch { fig.classList.add("is-missing"); }
      });
    }, { rootMargin: "500px 0px" });
    items.forEach((f) => io.observe(f));
    applyFilter(currentSlug);   // brands are only known now
  };
  const startUnlock = async (key) => {
    try {
      await unlockGrid(key);
      sessionStorage.setItem("boshra-gk", b64enc(await crypto.subtle.exportKey("raw", key)));
    } catch {
      // bad or stale key: forget the session and ask again
      sessionStorage.removeItem("boshra-gk"); sessionStorage.removeItem("boshra-gate");
      location.reload();
    }
  };
  if (grid && window.crypto?.subtle) {
    document.addEventListener("gate:open", (e) => deriveKey(e.detail.password).then(startUnlock));
    const saved = sessionStorage.getItem("boshra-gk");
    if (saved) importKey(b64dec(saved)).then(startUnlock);
    else if (sessionStorage.getItem("boshra-gate") === "open") {
      // unlocked before this version shipped: ask once more so the key exists
      sessionStorage.removeItem("boshra-gate"); location.reload();
    }
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
    sources.filter((el) => !el.classList.contains("is-hidden") && !el.classList.contains("is-missing") && !el.classList.contains("is-locked"));

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
      if (!el.classList.contains("is-missing") && !el.classList.contains("is-locked")) openAt(el);
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
