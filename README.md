# Boshra Hijazy — Portfolio

Personal portfolio for **Boshra Hijazy** (بُشْرَىٰ بِلال) — modest fashion model & interior designer.

**Live:** enable GitHub Pages (Settings → Pages → Deploy from branch → `main`, root) and the site will be served at `https://yalawi1.github.io/boshy/`.

## Stack

Pure HTML / CSS / JS — no build step, no dependencies. Just open `index.html` or serve the folder.

```
index.html      — single-page site
css/style.css   — design system (ivory / espresso / mocha palette)
js/main.js      — preloader, reveals, parallax, marquee, lightbox, counters
assets/img/     — photography from @boshrahijazy
```

## Sections

1. **Hero** — editorial intro with rotating badge & parallax portrait
2. **About** — bio + animated stats
3. **Modeling** — masonry gallery with lightbox (keyboard: ← → Esc)
4. **Brands** — marquee of collaborations (JUDE, Tajan Hijab, The Black Closet, Sumaya Couture, Trésor Accessories)
5. **Interiors** — interior design services
6. **Contact** — Instagram DM + email booking links

## Editing

- **Booking email:** search `mailto:` in `index.html` to change it.
- **Photos:** drop new images in `assets/img/` and add a `<figure class="gallery__item">` block.
- **Colors:** edit the CSS variables at the top of `css/style.css`.
