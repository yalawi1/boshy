# Boshra — Portfolio

Personal portfolio for **Boshra** (بُشْرَىٰ) — modest fashion model & interior designer.

**Live:** enable GitHub Pages (Settings → Pages → Deploy from branch → `main`, root) and the site will be served at `https://yalawi1.github.io/boshy/`.

## Stack

Pure HTML / CSS / JS — no build step, no dependencies, no external scripts. Just open `index.html` or serve the folder. Fonts load from Google Fonts; everything else is local.

```
index.html      — single-page site
css/style.css   — design system (burgundy · rose · blush · chocolate · cream palette)
js/main.js      — preloader, scroll reveals, hero parallax, brands accordion, 3D tilt cards
assets/img/     — studio photography + brand logos
```

Assets and scripts are cache-busted with a `?v=` query in `index.html` — bump it when you change `style.css` or `main.js`.

## Sections

1. **Hero** — full-bleed editorial: darkened studio photo, focus-frame crosshair detail, corner labels, and the name **Boshra بُشْرَىٰ** across the bottom
2. **The Model** — two studio shots as interactive 3D tilt cards
3. **Brands** — expandable accordion per brand (logo, blurb, campaign photo, link): JUDE × Judelle, Tajan Hijab, The Black Closet, Sumaya Couture, Trésor Accessories, Haize the Lable
4. **Interiors** — CSS 3D cube in the palette + services
5. **Contact** — Instagram DM link

## Editing

- **Contact:** the "Message on Instagram" link and Instagram handle live in the `#contact` section of `index.html`.
- **Photos:** drop new images in `assets/img/`. Studio photos are used in the hero and Model cards; brand campaign photos live in the accordion panels.
- **Colors:** edit the CSS custom properties at the top of `css/style.css`.
- **Accessibility:** respects `prefers-reduced-motion` (disables parallax, tilt, and reveal animations).
