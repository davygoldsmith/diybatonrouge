const section = document.body.dataset.section;
const grid = document.querySelector('#gallery');
let catalog = {};
const overlay = document.querySelector('#player-overlay');
const audio = document.querySelector('#audio-player');
let currentTracks = [];
let currentTrack = 0;
let playerOpener = null;
const playerStatus = document.querySelector('#player-status');

function element(tag, className, label) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (label !== undefined) node.textContent = label;
  return node;
}
function artFor(item, fallback = '♫') {
  const visual = element('div', 'card-visual');
  const src = section === 'music' ? item.cover : (section === 'art' ? item.url : null);
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    visual.append(img);
  } else if (section === 'poetry' || section === 'articles') {
    const sheet = element('div', 'live-paper');
    sheet.append(element('h3', '', item.title || 'Untitled'));
    sheet.append(element('p', 'live-paper-credit', item.artist ? 'by ' + item.artist : ''));
    sheet.append(element('pre', '', (item.body || '').slice(0, 700) + ((item.body || '').length > 700 ? '…' : '')));
    visual.append(sheet);
  } else visual.textContent = fallback;
  return visual;
}
function openWork(type, item) {
  if (type === 'art') { window.open(item.url, '_blank', 'noopener'); return; }
  const page = new URL('read.html', location.href);
  page.searchParams.set('type', type);
  page.searchParams.set('file', item.url);
  window.open(page.href, '_blank', 'noopener');
}
function selectCard(card) {
  for (const other of grid.querySelectorAll('.work-card')) if (other !== card) other.classList.remove('selected');
  card.classList.toggle('selected');
}
function addCard(item, i, tracks) {
  const card = element('article', 'work-card');
  card.classList.add('shape-' + (i * 7 + 3) % 6);
  const trigger = element('button', 'card-trigger');
  trigger.type = 'button';
  const visual = artFor(item);
  if (section === 'poetry' || section === 'articles') visual.classList.add('paper-preview');
  const details = element('div', 'card-info');
  const name = element('h2', '', item.title);
  const author = element('p', '', section === 'music' ? `${item.artist || ''} · ${tracks.length} ${tracks.length === 1 ? 'track' : 'tracks'}` : (item.artist || ''));
  details.append(name, author);
  trigger.append(visual, details);
  trigger.addEventListener('click', () => selectCard(card));
  card.append(trigger);
  const actions = element('div', 'card-actions');
  const button = element('button', '', section === 'music' ? (tracks.length === 1 && !tracks[0].album ? 'Play song ↗' : 'Open album ↗') : 'Read / view ↗');
  button.type = 'button';
  button.addEventListener('click', () => section === 'music' ? playAlbum(tracks) : openWork(section, item));
  actions.append(button);
  card.append(actions);
  grid.append(card);
}
function albumsFrom(tracks) {
  const albums = new Map();
  for (const track of tracks) {
    const name = (track.album || '').trim() || track.title || 'Untitled';
    const artist = track.artist || 'Local artist';
    const key = (track.album || '').trim() ? 'album:' + name.toLowerCase() : 'single:' + albums.size;
    if (!albums.has(key)) albums.set(key, {title: name, artist, cover: track.cover, tracks: []});
    const album = albums.get(key);
    album.tracks.push(track);
    if (!album.cover && track.cover) album.cover = track.cover;
  }
  return [...albums.values()];
}
function parseWork(text, item) {
  const rows = text.replace(/\r\n?/g, '\n').split('\n');
  const header = (rows[0] || '').trim().replace(/^>\s*/, '');
  const match = header.match(/^(.*?)\s+by\s+(.+)$/i);
  const result = Object.assign({}, item);
  if (match) { result.title = match[1].trim(); result.artist = match[2].trim(); }
  else if (header) result.title = header;
  result.body = rows.slice(1).join('\n').replace(/^\n/, '');
  return result;
}
function showItems(items) {
  if (!items.length) grid.append(element('p', 'empty-message', 'Nothing here yet. Check back for new work.'));
  else if (section === 'music') albumsFrom(items).forEach((album, i) => addCard(album, i, album.tracks));
  else items.forEach((item, i) => addCard(item, i, []));
}
fetch('content.json', {cache:'no-store'}).then(r => {if (!r.ok) throw Error('catalog unavailable'); return r.json();}).then(data => {
  catalog = data;
  const items = (catalog[section] || []).filter(x => x && x.url);
  if (section === 'poetry' || section === 'articles') {
    return Promise.all(items.map(item => fetch(item.url).then(r => {if (!r.ok) throw Error('missing text'); return r.text();}).then(text => parseWork(text,item)).catch(() => Object.assign({},item,{body:'Unable to load text.'})))).then(showItems);
  }
  showItems(items);
}).catch(() => grid.append(element('p', 'empty-message', 'Could not load content.json. Check its JSON formatting and file paths.')));

function playAlbum(tracks) {
  if (!tracks.length) return;
  playerOpener = document.activeElement;
  currentTracks = tracks;
  currentTrack = 0;
  const list = document.querySelector('#album-tracks');
  list.replaceChildren();
  const album = tracks[0]?.album || 'Single';
  document.querySelector('#album-name').textContent = album;
  const art = document.querySelector('#now-playing-art');
  art.replaceChildren();
  if (tracks[0]?.cover) {
    const img = document.createElement('img'); img.src = tracks[0].cover; img.alt = 'Album artwork'; art.append(img);
  } else art.textContent = '♫';
  tracks.forEach((track, i) => {
    const button = element('button', 'track-button', `${String(i + 1).padStart(2,'0')}  ${track.title}`);
    button.type = 'button';
    button.addEventListener('click', () => loadTrack(i));
    list.append(button);
  });
  overlay.hidden = false;
  document.body.classList.add('modal-open');
  loadTrack(0);
  document.querySelector('#close-player').focus();
}
function loadTrack(i) {
  currentTrack = i;
  const track = currentTracks[i];
  if (!track) return;
  document.querySelector('#now-playing-title').textContent = track.title;
  document.querySelector('#now-playing-artist').textContent = track.artist || '';
  document.querySelectorAll('.track-button').forEach((button, n) => {
    button.classList.toggle('playing', n === i);
    button.setAttribute('aria-current', n === i ? 'true' : 'false');
  });
  if (playerStatus) playerStatus.textContent = '';
  audio.pause();
  audio.src = new URL(track.url, document.baseURI).href;
  audio.load();
  const attempt = audio.play();
  if (attempt) attempt.catch(error => {
    if (playerStatus && error.name !== 'AbortError') playerStatus.textContent = 'Use the play button above to start audio.';
  });
}
function closePlayer() {
  audio.pause(); audio.removeAttribute('src'); audio.load();
  overlay.hidden = true; document.body.classList.remove('modal-open');
  if (playerStatus) playerStatus.textContent = '';
  if (playerOpener && playerOpener.isConnected) playerOpener.focus();
}
audio?.addEventListener('error', () => {
  if (playerStatus && audio.error) playerStatus.textContent = 'This track could not load. Check that the audio file exists in the music folder.';
});
audio?.addEventListener('playing', () => { if (playerStatus) playerStatus.textContent = ''; });
audio?.addEventListener('ended', () => { if (currentTrack + 1 < currentTracks.length) loadTrack(currentTrack + 1); });
document.querySelector('#close-player')?.addEventListener('click', closePlayer);
overlay?.addEventListener('click', e => { if (e.target === overlay) closePlayer(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay && !overlay.hidden) closePlayer(); });
