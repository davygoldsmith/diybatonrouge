// Content arrives from the same auto-generated catalog as the other galleries.
(() => {
  const gallery = document.getElementById('video-gallery');
  const overlay = document.getElementById('video-overlay');
  const player = document.getElementById('video-player');
  const close = document.getElementById('video-close');
  const title = document.getElementById('video-title');
  const artist = document.getElementById('video-artist');
  const status = document.getElementById('video-status');
  let previouslyFocused = null;
  function open(item) {
    previouslyFocused = document.activeElement;
    title.textContent = item.title || 'Untitled';
    artist.textContent = item.artist ? `by ${item.artist}` : 'Baton Rouge Alternative';
    status.textContent = '';
    overlay.hidden = false;
    document.body.classList.add('modal-open');
    if (item.poster) player.poster = item.poster;
    else player.removeAttribute('poster');
    player.src = item.url;
    player.load();
    close.focus();
    // Playback requires explicit user interaction; opening a tile counts as that.
    const started = player.play();
    if (started) started.catch(err => {
      if (err.name !== 'AbortError') status.textContent = 'Press play to start the video.';
    });
  }
  function dismiss() {
    player.pause();
    player.removeAttribute('src');
    player.load();
    overlay.hidden = true;
    document.body.classList.remove('modal-open');
    status.textContent = '';
    if (previouslyFocused && previouslyFocused.isConnected) previouslyFocused.focus();
  }
  close.addEventListener('click', dismiss);
  overlay.addEventListener('click', e => { if (e.target === overlay) dismiss(); });
  window.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); dismiss(); }
    if (e.key === 'Tab' && e.shiftKey && document.activeElement === close) {
      e.preventDefault(); player.focus();
    } else if (e.key === 'Tab' && !e.shiftKey && document.activeElement === player) {
      e.preventDefault(); close.focus();
    }
  });
  player.addEventListener('error', () => {
    if (!overlay.hidden) status.textContent = 'Video cannot play in this browser. Try an MP4 encoded with H.264 video and AAC audio.';
  });
  player.addEventListener('playing', () => { status.textContent = ''; });

  function render(items) {
    gallery.replaceChildren();
    if (!items.length) {
      const empty=document.createElement('div');
      empty.className='br-video-empty';
      const heading=document.createElement('h2'); heading.textContent='A screen waiting for its first story';
      const note=document.createElement('p'); note.textContent='The video shelf is open. New films, performances and moving images will appear here.';
      empty.append(heading,note);
      gallery.append(empty); return;
    }
    items.forEach((item,i) => {
      const card=document.createElement('article');
      card.className=`br-video-tile br-video-tile--${i%6}`;
      const link=document.createElement('button');
      link.className='br-video-open';link.type='button';
      link.setAttribute('aria-label',`Play ${item.title || 'video'}`);
      const picture=document.createElement('div');picture.className='br-video-picture';
      if (item.poster) {
        const img=document.createElement('img');img.src=item.poster;
        img.alt='';img.loading='lazy';img.decoding='async';
        picture.append(img);
      } else {
        picture.classList.add('br-no-poster');
        picture.textContent = 'BR / ALT';
      }
      const symbol=document.createElement('span'); symbol.className='br-play-symbol';symbol.textContent='▶'; symbol.setAttribute('aria-hidden','true');
      picture.append(symbol);
      const caption=document.createElement('span');caption.className='br-video-caption';
      const name=document.createElement('strong');name.textContent=item.title || 'Untitled';
      const by=document.createElement('span');by.textContent=item.artist || 'Video / Baton Rouge Alternative';
      caption.append(name,by);
      link.append(picture,caption);
      link.addEventListener('click',()=>open(item));
      card.append(link);
      gallery.append(card);
    });
  }
  fetch('content.json',{cache:'no-store'})
    .then(r=>{if(!r.ok)throw Error('Unavailable');return r.json();})
    .then(data=>render(Array.isArray(data.videos)?data.videos:[]))
    .catch(()=>{gallery.textContent='The video collection could not load right now.';});
})();
