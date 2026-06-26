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
  (x, i) => `
  <article class="card xp-card" data-reveal data-reveal-delay="${i % 3}">
    <div class="body">
      <span class="idx">${x.when}</span>
      <div class="meta"><h3>${x.role}</h3><div class="org">${x.org}</div></div>
      <p>${x.body}</p>
    </div>
  </article>`
).join("");

$("#aboutText").innerHTML = ABOUT.map((p) => `<p>${p}</p>`).join("");

// contact: themed icon links (email / github / linkedin)
const ICONS = {
  email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></svg>`,
  github: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.42 7.86 10.95.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.72-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A11.52 11.52 0 0 0 23.5 12.02C23.5 5.74 18.27.5 12 .5Z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg>`,
};
const links = [
  { key: "email", label: "Email", href: `mailto:${PROFILE.email}` },
  { key: "github", label: "GitHub", href: PROFILE.github },
  { key: "linkedin", label: "LinkedIn", href: PROFILE.linkedin },
];
$("#contactLinks").innerHTML = links
  .map(
    (l) =>
      `<a href="${l.href}" class="icon" aria-label="${l.label}" title="${l.label}"${l.href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${ICONS[l.key]}</a>`
  )
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

// smooth-scroll the nav. Home -> very top, Contact -> very bottom, and
// About/Projects/Experience center that section's content (text + images)
// vertically in the viewport, rather than pinning its heading to the top.
function navDestination(hash) {
  if (hash === "#top") return 0;
  if (hash === "#contact") return document.documentElement.scrollHeight; // Lenis clamps to bottom
  const section = document.querySelector(hash);
  if (!section) return null;
  const content = section.querySelector(".wrap") || section;
  const rect = content.getBoundingClientRect();
  const contentCenter = lenis.scroll + rect.top + rect.height / 2; // absolute y of the content centroid
  return contentCenter - window.innerHeight / 2; // align that centroid with the viewport center
}
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const dest = navDestination(a.getAttribute("href"));
    if (dest == null) return;
    e.preventDefault();
    lenis.scrollTo(dest, { immediate: reduce });
  });
});

/* ---------- reveal + boot ---------- */
initReveal();
requestAnimationFrame(() => $("#boot").classList.add("gone"));
