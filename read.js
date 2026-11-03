// The original .txt file is the source of truth, including its line breaks and tabs.
const params = new URLSearchParams(window.location.search);
const type = params.get('type');
const file = params.get('file');
const titleNode = document.querySelector('#read-title');
const artistNode = document.querySelector('#read-artist');
const bodyNode = document.querySelector('#read-body');
const frameNode = document.querySelector('#reader-frame');
const hintNode = document.querySelector('#read-hint');
const backLink = document.querySelector('#reader-back');

function fail(message = 'Unable to open this work.') {
  titleNode.textContent = 'Work unavailable';
  bodyNode.textContent = message;
}
function updateScrollHint() {
  if (frameNode.classList.contains('is-spatial')) {
    hintNode.hidden = !(frameNode.scrollWidth > frameNode.clientWidth + 2);
  }
}
if (!['poetry', 'articles'].includes(type) || !file) {
  fail();
} else {
  const directory = type + '/';
  backLink.href = type + '.html';
  backLink.textContent = '← Back to ' + (type === 'poetry' ? 'Poetry' : 'Articles');
  // Only fetch a listed .txt file in the matching site directory.
  if (!file.startsWith(directory) || !file.toLowerCase().endsWith('.txt') || file.includes('..')) {
    fail();
  } else {
    Promise.all([
      fetch('content.json', {cache: 'no-store'}).then(r => { if (!r.ok) throw Error('catalog'); return r.json(); }),
      fetch(file, {cache: 'no-store'}).then(r => { if (!r.ok) throw Error('file'); return r.text(); })
    ]).then(([data, text]) => {
      const item = (data[type] || []).find(entry => entry.url === file);
      if (!item) throw Error('missing catalog entry');
      const rows = text.replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '').split('\n');
      const header = (rows[0] || '').trim().replace(/^>\s*/, '');
      const matched = header.match(/^(.*?)\s+by\s+(.+)$/i);
      const title = matched ? matched[1].trim() : (header || item.title || 'Untitled');
      const artist = matched ? matched[2].trim() : (item.artist || '');
      // Remove only the separator between the heading and first stanza; leave everything else intact.
      const textRows = rows.slice(1);
      if (textRows[0] === '') textRows.shift();
      const body = textRows.join('\n');
      document.title = title + ' | Baton Rouge Alternative';
      titleNode.textContent = title;
      artistNode.textContent = artist ? 'by ' + artist : '';
      bodyNode.textContent = body;
      const spatial = type === 'poetry' && (/\t/.test(body) || /^ {3,}\S/m.test(body));
      frameNode.classList.toggle('is-spatial', spatial);
      if (spatial) {
        // Tabs are 8 columns in the original .txt. Keep the typographic shape unwrapped.
        window.addEventListener('resize', updateScrollHint, {passive: true});
        requestAnimationFrame(updateScrollHint);
      }
    }).catch(() => fail());
  }
}
