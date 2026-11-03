// Zine pages along the edges of the homepage.
(function () {
  var library = [];
  var staticPages = ["generated/page-27322a858e0bbf1.jpg", "generated/page-b4325ee5c997dcf.jpg", "generated/page-ab3b568df4b4807.jpg", "generated/page-8a2099b584cdda5.jpg", "generated/page-26e731b13dcf6be.jpg", "generated/page-9fa55e91761e5af.jpg", "generated/page-5be409a62689847.jpg", "generated/page-2c75657355a09cd.jpg", "generated/page-d0d70514e00683b.jpg", "generated/page-592dafc08105138.jpg", "generated/page-f49eb0aa94ec20f.jpg", "generated/page-631fb2648b29b6c.jpg"];
  var pages = [];
  for (var i = 0; i < library.length; i++) {
    if (library[i] && library[i].image) pages.push(library[i].image);
  }
  if (!pages.length) pages = staticPages.slice();

  var phone = window.innerWidth < 700;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var count = phone ? 3 : 8;
  var cards = [];
  var cursor = Math.floor(Math.random() * pages.length);
  function random(a, b) { return a + Math.random() * (b - a); }
  function nextImage() { cursor = (cursor + 1 + Math.floor(Math.random() * 7)) % pages.length; return pages[cursor]; }
  function show(c, instant) {
    c.box.style.transition = (instant || reduce) ? 'none' : 'transform 690ms ease-out, width 690ms ease-out';
    c.box.style.width = c.width + 'px';
    c.box.style.transform = 'translate(' + Math.round(c.x) + 'px,' + Math.round(c.y) + 'px) rotate(' + c.turn + 'deg)';
  }
  function make(side) {
    var rail = document.createElement('div');
    rail.className = 'border-stream ' + side;
    rail.setAttribute('aria-hidden', 'true');
    document.body.appendChild(rail);
    for (var n = 0; n < count; n++) {
      var box = document.createElement('div');
      box.className = 'floating-page';
      var img = document.createElement('img');
      img.alt = '';
      img.loading = 'eager';
      box.appendChild(img);
      rail.appendChild(box);
      var width = phone ? random(95, 155) : random(165, 320);
      var c = {box:box, img:img, side:side, width:width, x:random(-28,35),
        y:phone ? n * 270 - 130 : n * 180 - 320,
        height:width * 1.4, turn:random(-17,17), speed:phone?random(45,90):random(65,120)};
      cards.push(c);
      (function(card) {
        img.onload = function () {
          if (img.naturalWidth && img.naturalHeight)
            card.height = card.width * img.naturalHeight / img.naturalWidth;
        };
        img.onerror = function () {
          // A broken page shouldn't leave a blank space.
          if (card.retries < 3) {
            card.retries++;
            img.src = nextImage();
          }
        };
      })(c);
      c.retries = 0;
      img.src = nextImage();
      show(c,true);
    }
  }
  make('left');
  make('right');
  fetch('content.json').then(function (res) { return res.json(); }).then(function (data) {
    if (data.border && data.border.length) {
      var incoming = [];
      for (var j = 0; j < data.border.length; j++) if (data.border[j].image) incoming.push(data.border[j].image);
      if (incoming.length) pages = incoming;
    }
  }).catch(function () {});

  // Reduced motion keeps the collage, without making it move.
  if (reduce) return;

  var last = Date.now();
  function advance() {
    if (document.hidden) return;
    var now = Date.now();
    var elapsed = Math.min((now-last)/630, 1.5);
    last = now;
    for (var k=0; k<cards.length; k++) {
      var c = cards[k];
      c.y -= c.speed * elapsed;
      c.x += random(phone?-9:-28, phone?9:28);
      c.x = Math.max(phone?-35:-90,Math.min(phone?55:125,c.x));
      c.turn += random(-8,8);
      c.turn = Math.max(-27,Math.min(27,c.turn));
      if (!phone && Math.random()<0.13) c.width = Math.max(155,Math.min(340,c.width+random(-32,32)));
      if (c.y+c.height < -100) {
        c.y = window.innerHeight + random(20,220);
        c.x = random(-20,55);
        c.width = phone?random(95,155):random(165,320);
        c.retries = 0;
        c.img.src = nextImage();
        show(c,true);
      } else show(c,false);
    }
  }
  window.setInterval(advance, 630);
})();
