/* Boshra — The Model · interactions + 3D */

/* ── Preloader ── */
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("preloader").classList.add("is-done");
    document.body.classList.add("is-loaded");
  }, 800);
});

/* ── Header ── */
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

/* ── Reveal on scroll ── */
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

/* ── Counters ── */
const counterIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.count;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / 1400, 1);
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

/* ── 3D tilt cards ── */
const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
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

/* ── Footer year ── */
document.getElementById("year").textContent = new Date().getFullYear();

/* ── Hero: silk blob (Three.js) ── */
if (!prefersReduced) initSilk();

async function initSilk() {
  let THREE;
  try {
    THREE = await import("https://unpkg.com/three@0.160.0/build/three.module.js");
  } catch {
    return; // offline or CDN blocked — hero stays typographic
  }

  const canvas = document.getElementById("silk");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    canvas.style.display = "none";
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.z = 7;

  // Palette from the moodboard
  const uniforms = {
    uTime: { value: 0 },
    uBurgundy: { value: new THREE.Color("#7e2039") },
    uRose: { value: new THREE.Color("#d9829b") },
    uBlush: { value: new THREE.Color("#ddc6c1") },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vView;
      varying float vDisp;

      float wave(vec3 p, float f, float s) {
        return sin(p.x * f + uTime * s) * sin(p.y * f * 1.3 + uTime * s * 0.8) * sin(p.z * f * 0.9 + uTime * s * 1.1);
      }

      void main() {
        float d = 0.28 * wave(position, 1.6, 0.55)
                + 0.12 * wave(position, 3.2, 0.85)
                + 0.05 * wave(position, 6.0, 1.2);
        vDisp = d;
        vec3 p = position + normal * d;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uBurgundy;
      uniform vec3 uRose;
      uniform vec3 uBlush;
      varying vec3 vNormal;
      varying vec3 vView;
      varying float vDisp;

      void main() {
        float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.0);
        float band = smoothstep(-0.35, 0.4, vDisp);
        vec3 base = mix(uBurgundy, uRose, band);
        vec3 col = mix(base, uBlush, fresnel * 0.85);
        float sheen = pow(max(dot(normalize(vNormal), normalize(vec3(0.4, 0.7, 0.6))), 0.0), 6.0);
        col += sheen * 0.18;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9, 96), material);
  scene.add(blob);

  // Sizing: keep the blob right-of-center on wide screens, behind text on small
  const hero = document.querySelector(".hero");
  const resize = () => {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (w > 900) {
      blob.position.set(2.6, 0.1, 0);
      blob.scale.setScalar(1);
      material.transparent = false;
      canvas.style.opacity = "1";
    } else {
      blob.position.set(0, 0.4, 0);
      blob.scale.setScalar(0.8);
      canvas.style.opacity = "0.35";
    }
  };
  resize();
  addEventListener("resize", resize);

  // Mouse drift
  let mx = 0, my = 0, tx = 0, ty = 0;
  addEventListener("pointermove", (e) => {
    tx = (e.clientX / innerWidth - 0.5) * 0.5;
    ty = (e.clientY / innerHeight - 0.5) * 0.35;
  }, { passive: true });

  // Only render while the hero is on screen
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible || document.hidden) return;
    uniforms.uTime.value = clock.getElapsedTime();
    mx += (tx - mx) * 0.04;
    my += (ty - my) * 0.04;
    blob.rotation.y = mx * 1.4 + uniforms.uTime.value * 0.06;
    blob.rotation.x = my * 1.2;
    renderer.render(scene, camera);
  });
}
