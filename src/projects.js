// ---------------------------------------------------------------------------
// Project switcher with crossfade transition
// ---------------------------------------------------------------------------
import { PROJECTS } from './config.js';

const $ = (id) => document.getElementById(id);

export function initProjects() {
  let i = 0;
  const hero = document.querySelector('.hero');

  function render() {
    const p = PROJECTS[i];
    $('projTitle').innerHTML = `<span class="light">${p.title[0]}</span><br>${p.title[1]}`;
    $('projBody').textContent = p.body;
    $('projTags').innerHTML = p.tags.map((t) => `<span>${t}</span>`).join('');
    $('projNum').textContent = String(i + 1).padStart(2, '0');
    $('projOf').textContent = String(PROJECTS.length).padStart(2, '0');
    $('projEyebrow').textContent = PROJECTS
      .map((_, n) => (n === i ? `PROJECT 0${n + 1}` : `0${n + 1}`))
      .join(' / ');
  }

  // Crossfade: fade out, swap content at the midpoint, fade back in.
  function go(delta) {
    hero.classList.add('is-switching');
    setTimeout(() => {
      i = (i + delta + PROJECTS.length) % PROJECTS.length;
      render();
      hero.classList.remove('is-switching');
    }, 280);
  }

  $('next').onclick = () => go(1);
  $('prev').onclick = () => go(-1);
  render();
}
