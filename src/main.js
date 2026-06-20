// ---------------------------------------------------------------------------
// Boot: fonts, styles, content render, smooth scroll (Lenis) -> 3D scene.
// ---------------------------------------------------------------------------
import "@fontsource/josefin-sans/latin-300.css";
import "@fontsource/josefin-sans/latin-400.css";
import "@fontsource/josefin-sans/latin-600.css";
import "@fontsource/josefin-sans/latin-700.css";
import "@fontsource/josefin-slab/latin-300.css";
import "@fontsource/josefin-slab/latin-400.css";
import "./styles/main.css";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { initReveal } from "./lib/reveal.js";
import { PROFILE, PROJECTS, EXPERIENCE, ABOUT } from "./config.js";

const $ = (s) => document.querySelector(s);

/* ---------- inject content from config ---------- */
function bgImage(src) {
  return src ? ` style="background-image:url('${src}');background-size:cover;background-position:center"` : "";
}

$("#projectGrid").innerHTML = PROJECTS.map(
  (p, i) => `
  <article class="card" data-reveal data-reveal-delay="${i % 3}">
    <div class="thumb"${bgImage(p.image)} data-img="${p.image ? "" : "IMAGE - /public/images/"}"></div>
    <div class="body">
      <span class="idx">${String(i + 1).padStart(2, "0")}</span>
      <h3>${p.title}</h3>
      <p>${p.body}</p>
      <div class="tags">${p.tags.map((t) => `<span>${t}</span>`).join("")}</div>
    </div>
  </article>`
).join("");

$("#timeline").innerHTML = EXPERIENCE.map(
  (x) => `
  <div class="xp" data-reveal>
    <div class="when">${x.when}</div>
    <div class="what">
      <h3>${x.role}</h3>
      <div class="org">${x.org}</div>
      <p>${x.body}</p>
    </div>
  </div>`
).join("");

$("#aboutText").innerHTML = ABOUT.map((p) => `<p>${p}</p>`).join("");

// contact links
const links = [
  PROFILE.resume ? { label: "Résumé", href: PROFILE.resume } : null,
  { label: "Email", href: `mailto:${PROFILE.email}`, primary: true },
  { label: "GitHub", href: PROFILE.github },
  { label: "LinkedIn", href: PROFILE.linkedin },
].filter(Boolean);
$("#contactLinks").innerHTML = links
  .map((l) => `<a href="${l.href}"${l.primary ? ' class="primary"' : ""}${l.href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${l.label}</a>`)
  .join("");

/* ---------- smooth scroll ---------- */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: !reduce, syncTouch: false });

let globe = null;
function onScroll({ scroll, limit }) {
  const p = limit > 0 ? scroll / limit : 0;
  if (globe) globe.setProgress(p);
}
lenis.on("scroll", onScroll);

/* ---------- 3D scene: loaded on idle so it never blocks first paint ---------- */
const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
idle(() => {
  import("./lib/Globe3D.js")
    .then(({ Globe3D }) => {
      globe = new Globe3D($("#scene"));
      globe.start();
      onScroll({ scroll: lenis.scroll, limit: lenis.limit }); // sync current position
      window.addEventListener("beforeunload", () => globe.dispose());
    })
    .catch((err) => {
      console.error("3D scene unavailable, continuing without it:", err);
      $("#scene").style.display = "none";
      document.body.classList.add("no-webgl");
    });
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// smooth-scroll the nav
const header = document.querySelector(".topbar");
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (target) {
      e.preventDefault();
      // offset by the fixed topbar so section headings don't hide under it
      lenis.scrollTo(target, { offset: -(header?.offsetHeight ?? 0), immediate: reduce });
    }
  });
});

/* ---------- reveal + boot ---------- */
initReveal();
requestAnimationFrame(() => $("#boot").classList.add("gone"));
