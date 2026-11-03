// Each zine PDF is rendered into image spreads by scripts/build_site.py.
// The source PDF is untouched and available to download at any time.
(() => {
  const tabs = document.querySelector('#br-issue-tabs');
  const img = document.querySelector('#br-zine-image');
  if (!tabs || !img) return;
  const title = document.querySelector('#br-zine-title');
  const current = document.querySelector('#br-current-page');
  const total = document.querySelector('#br-total-pages');
  const download = document.querySelector('#br-zine-download');
  const prev = document.querySelector('#br-prev');
  const next = document.querySelector('#br-next');
  const first = document.querySelector('#br-first');
  const last = document.querySelector('#br-last');
  const frame = document.querySelector('#br-slider-frame');
  let issues = [], issue = 0, page = 0, touchStart = null;

  function show() {
    const z = issues[issue];
    if (!z) return;
    page = Math.min(Math.max(0, page), z.pages.length - 1);
    title.textContent = z.title;
    img.src = z.pages[page];
    img.alt = `${z.title}, print spread ${page + 1} of ${z.pages.length}`;
    current.textContent = String(page + 1);
    total.textContent = String(z.pages.length);
    download.href = z.pdf;
    prev.disabled = first.disabled = page <= 0;
    next.disabled = last.disabled = page >= z.pages.length - 1;
    [...tabs.children].forEach((b, i) => {
      const active = i === issue;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    // Preload the next spread for a smoother turn, especially on phones.
    if (page + 1 < z.pages.length) {
      const future = new Image();
      future.src = z.pages[page + 1];
    }
  }
  function choose(index) { issue = index; page = 0; show(); }
  function turn(n) { page += n; show(); }
  prev.addEventListener('click', () => turn(-1));
  next.addEventListener('click', () => turn(1));
  first.addEventListener('click', () => { page = 0; show(); });
  last.addEventListener('click', () => { page = issues[issue].pages.length - 1; show(); });
  frame.addEventListener('touchstart', e => {
    if (e.touches.length === 1) touchStart = {x:e.touches[0].clientX,y:e.touches[0].clientY};
  }, {passive:true});
  frame.addEventListener('touchend', e => {
    if (!touchStart || !e.changedTouches.length) return;
    const dx=e.changedTouches[0].clientX-touchStart.x;
    const dy=e.changedTouches[0].clientY-touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) turn(dx < 0 ? 1 : -1);
  }, {passive:true});
  frame.tabIndex = 0;
  frame.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); turn(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1); }
  });
  img.addEventListener('error', () => {
    img.removeAttribute('src');
    img.alt = 'Preview unavailable. Please download the original PDF instead.';
  });
  fetch('zines-manifest.json', {cache:'no-store'})
    .then(r => { if (!r.ok) throw Error('Cannot load the zine archive'); return r.json(); })
    .then(data => {
      issues = data.filter(x => x && x.pdf && Array.isArray(x.pages) && x.pages.length);
      if (!issues.length) {
        document.querySelector('#br-reader-card').innerHTML='<p class="br-empty">No zines in the reader yet. Come back soon.</p>';
        return;
      }
      issues.forEach((z,i) => {
        const b=document.createElement('button');
        b.type='button'; b.className='br-issue-tab';
        b.textContent=z.label || z.title; b.setAttribute('aria-label', z.title); b.addEventListener('click',()=>choose(i));
        tabs.appendChild(b);
      });
      choose(0);
    }).catch(() => {
      document.querySelector('#br-reader-card').innerHTML='<p class="br-empty">The reader could not load. The downloads below are still available.</p>';
    });
})();
