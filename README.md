# Boshra Hijazy — Portfolio

Personal portfolio for **Boshra Hijazy** (بُشْرَىٰ بِلال) — modest fashion model & interior designer.

**Live:** enable GitHub Pages (Settings → Pages → Deploy from branch → `main`, root) and the site will be served at `https://yalawi1.github.io/boshy/`.

## Stack

Pure HTML / CSS / JS — no build step, no dependencies. Just open `index.html` or serve the folder.

```
index.html      — single-page site
css/style.css   — design system (burgundy · rose · blush · chocolate · cream palette)
js/main.js      — preloader, reveals, Three.js hero blob, 3D tilt cards, marquee, counters
assets/img/     — photography from @boshrahijazy
```

## Sections

1. **Hero** — typographic intro with a mouse-reactive Three.js silk blob
2. **The Model** — two studio shots as 3D tilt cards + animated stats
3. **Brands** — marquee of collaborations (JUDE, Tajan Hijab, The Black Closet, Sumaya Couture, Trésor Accessories)
4. **Interiors** — CSS 3D cube in the moodboard palette + services
5. **Contact** — Instagram DM + email booking links

## Editing

- **Booking email:** search `mailto:` in `index.html` to change it.
- **Photos:** drop new images in `assets/img/` and add a `<figure class="gallery__item">` block.
- **Colors:** edit the CSS variables at the top of `css/style.css`.
