# Boshra — Portfolio

Personal portfolio for **Boshra** (بُشْرَىٰ) — modest fashion model & interior designer.

**Live:** https://boshrabelal.com

**Hosting note:** Netlify's edge is blocked by Egyptian ISPs, so the site must be served
from a host that is reachable in Egypt (Cloudflare Pages preferred — it has a Cairo PoP;
GitHub Pages works too). `CNAME` and `.nojekyll` in the repo root are for the GitHub Pages
path; Cloudflare Pages ignores them. Build settings: none — static site, publish the repo root.

## Stack

Pure HTML / CSS / JS — no build step, no dependencies, no external scripts. Just open `index.html` or serve the folder. Fonts load from Google Fonts; everything else is local.

```
index.html      — landing (hero, about, brands carousel, interiors teaser, contact)
gallery.html    — modeling gallery: 13 brands, filter chips, lightbox
interiors.html  — interior design page: canvas study, services, projects, experience
css/style.css   — design system (white · grey · rose pink · charcoal palette)
js/main.js      — gate, preloader, reveals, hero parallax, brands 3D carousel, tilt cards, floor-plan canvas
js/gallery.js   — gallery brand filters + lightbox
assets/img/     — studio photography + brand logos
```

Assets and scripts are cache-busted with a `?v=` query in `index.html` — bump it when you change `style.css` or `main.js`.

## Sections

1. **Hero** — full-bleed editorial: darkened studio photo, focus-frame crosshair detail, corner labels, and the name **Boshra بُشْرَىٰ** across the bottom
2. **The Model** — two studio shots as interactive 3D tilt cards
3. **Brands** — 3D coverflow carousel of brand cards (logo, campaign photo, link) with a booking CTA: JUDE × Judelle, Tajan Hijab, The Black Closet, Sumaya Couture, Trésor Accessories, Haize the Lable
4. **Interiors — Space Maker** — framed canvas floor-plan animation, services, experience/education cards, LinkedIn link
5. **Contact** — Instagram DM link

## Password gate

The site is gated behind a client-side password screen (session-scoped). The password is not stored in the source — only its SHA-256 hash in `js/main.js` (`GATE_HASH`). To change the password, generate a new hash (`python3 -c "import hashlib;print(hashlib.sha256(b'NEW').hexdigest())"`) and replace the constant. Note: this deters casual visitors only — a static site cannot enforce real authentication.

## Editing

- **Contact:** the "Message on Instagram" link and Instagram handle live in the `#contact` section of `index.html`.
- **Photos:** drop new images in `assets/img/`. Studio photos are used in the hero and Model cards; brand campaign photos live in the accordion panels.
- **Colors:** edit the CSS custom properties at the top of `css/style.css`.
- **Accessibility:** respects `prefers-reduced-motion` (disables parallax, tilt, and reveal animations).
