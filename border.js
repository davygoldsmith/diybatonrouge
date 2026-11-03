
 // Baton Rouge Alternative — consistent, independently climbing pages.
 // Replace border.js. Old border CSS classes are intentionally not used.
 (function () {
   'use strict';

   var FALLBACK = [
     'generated/page-27322a858e0bbf1.jpg',
     'generated/page-b4325ee5c997dcf.jpg',
     'generated/page-ab3b568df4b4807.jpg',
     'generated/page-8a2099b584cdda5.jpg',
     'generated/page-26e731b13dcf6be.jpg',
     'generated/page-9fa55e91761e5af.jpg',
     'generated/page-5be409a62689847.jpg',
     'generated/page-2c75657355a09cd.jpg',
     'generated/page-d0d70514e00683b.jpg',
     'generated/page-592dafc08105138.jpg',
     'generated/page-f49eb0aa94ec20f.jpg',
     'generated/page-631fb2648b29b6c.jpg'
   ];

   if (document.getElementById('bralt-edge-styles')) return;

   var css = document.createElement('style');
   css.id = 'bralt-edge-styles';
   css.textContent = [
     '.bralt-edge-rail{position:fixed;top:0;bottom:0;',
     'width:clamp(215px,22vw,355px);overflow:hidden;',
     'pointer-events:none;z-index:0;opacity:.73}',
     '.bralt-edge-left{left:-35px}',
     '.bralt-edge-right{right:-35px}',
     '.bralt-edge-page{position:absolute;top:0;left:0;',
     'transform-origin:center;will-change:transform;',
     'transition:transform 610ms cubic-bezier(.18,.74,.22,1),',
     'width 610ms ease,height 610ms ease}',
     '.bralt-edge-page img{display:block;width:100%;height:100%;',
     'object-fit:contain;filter:grayscale(1) contrast(1.12);',
     'box-shadow:0 2px 12px #0008}',
     '@media(max-width:1200px){.bralt-edge-rail{',
     'width:clamp(185px,23vw,290px);opacity:.5}}',
     '@media(max-width:700px){.bralt-edge-rail{',
     'width:clamp(160px,44vw,205px);opacity:.4}',
     '.bralt-edge-left{left:-85px}',
     '.bralt-edge-right{right:-85px}}',
     '@media(prefers-reduced-motion:reduce){',
     '.bralt-edge-page{transition:none}}'
   ].join('');

   document.head.appendChild(css);

   var reduce = false;
   try {
     reduce = window.matchMedia(
       '(prefers-reduced-motion: reduce)'
     ).matches;
   } catch (e) {}

   var pool = [];
   var rails = [];
   var imageIndex = 0;
   var started = false;
   var resizeTimer;

   function random(a, b) {
     return a + Math.random() * (b - a);
   }

   function clamp(n, a, b) {
     return Math.max(a, Math.min(b, n));
   }

   function shuffle(values) {
     var arr = values.slice();

     for (var i = arr.length - 1; i > 0; i--) {
       var j = Math.floor(Math.random() * (i + 1));
       var tmp = arr[i];
       arr[i] = arr[j];
       arr[j] = tmp;
     }

     return arr;
   }

   function nextPage(lastSrc) {
     if (!pool.length) return null;

     var candidate = pool[imageIndex++ % pool.length];

     if (pool.length > 1 && candidate.src === lastSrc) {
       candidate = pool[imageIndex++ % pool.length];
     }

     return candidate;
   }

   // Only display images once they have loaded and decoded.
   function preload(src) {
     return new Promise(function (resolve) {
       var img = new Image();

       img.onload = function () {
         if (!img.naturalWidth || !img.naturalHeight) {
           return resolve(null);
         }

         var data = {
           src: src,
           ratio: img.naturalHeight / img.naturalWidth
         };

         if (img.decode) {
           img.decode().then(
             function () { resolve(data); },
             function () { resolve(data); }
           );
         } else {
           resolve(data);
         }
       };

       img.onerror = function () {
         resolve(null);
       };

       img.src = src;
     });
   }

   function setPage(card, data) {
     card.data = data;

     var rail = card.rail;
     var mobile = rail.mobile;

     var targetWidth = rail.width * random(
       mobile ? .7 : .57,
       mobile ? .96 : .87
     );

     var heightCap = rail.spacing * (
       mobile ? .94 : 1.11
     );

     // Respect each image's actual proportions.
     card.width = Math.round(
       Math.min(targetWidth, heightCap / data.ratio)
     );

     card.height = Math.round(
       card.width * data.ratio
     );

     card.x = random(
       -4,
       Math.max(-3, rail.width - card.width + 4)
     );

     card.angle = random(-16, 16);
     card.drift = random(-22, 22);

     card.el.style.width = card.width + 'px';
     card.el.style.height = card.height + 'px';
     card.img.src = data.src;
   }

   function paint(card, immediate) {
     var el = card.el;

     if (immediate) {
       el.style.transition = 'none';
     }

     el.style.width = card.width + 'px';
     el.style.height = card.height + 'px';

     el.style.transform =
       'translate3d(' +
       Math.round(card.x) + 'px,' +
       Math.round(
         card.base - card.rail.travel + card.drift
       ) + 'px,0) rotate(' +
       card.angle.toFixed(1) + 'deg)';

     if (immediate) {
       // Reposition offscreen without animating the jump.
       void el.offsetHeight;
       el.style.transition = '';
     }
   }

   function addCard(rail, base) {
     var el = document.createElement('div');
     el.className = 'bralt-edge-page';

     var img = document.createElement('img');
     img.alt = '';
     img.loading = 'eager';
     img.decoding = 'async';

     el.appendChild(img);
     rail.el.appendChild(el);

     var card = {
       el: el,
       img: img,
       rail: rail,
       base: base,
       drift: 0,
       angle: 0,
       x: 0,
       width: 0,
       height: 0,
       data: null
     };

     setPage(card, nextPage(null));

     rail.cards.push(card);
     paint(card, true);
   }

   function makeRail(side) {
     var el = document.createElement('div');

     el.className =
       'bralt-edge-rail bralt-edge-' + side;

     el.setAttribute('aria-hidden', 'true');
     document.body.appendChild(el);

     var mobile = window.innerWidth < 700;

     // Main density control.
     // Larger spacing = fewer visible pages.
     var spacing = mobile ? 250 : 325;

     var rail = {
       el: el,
       mobile: mobile,
       width: el.getBoundingClientRect().width,
       spacing: spacing,
       travel: 0,
       cards: [],
       maxBase: 0
     };

     rails.push(rail);

     // Maintain a fixed number of vertical positions,
     // including pages waiting just outside the viewport.
     var count = Math.ceil(
       window.innerHeight / spacing
     ) + 3;

     for (var i = 0; i < count; i++) {
       var base = (i - 1) * spacing;

       rail.maxBase = base;
       addCard(rail, base);
     }
   }

   function rebuild() {
     rails.forEach(function (rail) {
       rail.el.remove();
     });

     rails = [];

     if (!pool.length) return;

     makeRail('left');
     makeRail('right');
   }

   function advance() {
     if (document.hidden || reduce) return;

     rails.forEach(function (rail) {

       // Stable overall upward progression.
       rail.travel += rail.mobile ? 57 : 72;

       rail.cards.forEach(function (card) {

         // Every page climbs independently within
         // its own small range of movement.
         card.drift = clamp(
           card.drift + random(-29, 29),
           -43,
           43
         );

         // Random sideways wandering.
         card.x = clamp(
           card.x + random(-24, 24),
           -9,
           Math.max(
             -8,
             rail.width - card.width + 9
           )
         );

         // Random rotation.
         card.angle = clamp(
           card.angle + random(-8, 8),
           -23,
           23
         );

         // Occasional subtle size changes.
         if (Math.random() < .16) {
           var nextWidth = clamp(
             card.width + random(-13, 13),
             rail.width * (
               rail.mobile ? .56 : .49
             ),
             rail.width * .9
           );

           nextWidth = Math.min(
             nextWidth,
             rail.spacing * (
               rail.mobile ? .94 : 1.11
             ) / card.data.ratio
           );

           card.width = Math.round(nextWidth);

           card.height = Math.round(
             card.width * card.data.ratio
           );
         }

         var y =
           card.base - rail.travel + card.drift;

         // Wait until the rotated page is entirely
         // above the viewport before replacing it.
         if (
           y + card.height +
           card.width * .30 < -35
         ) {

           // Preserve the spacing pattern.
           rail.maxBase += rail.spacing;
           card.base = rail.maxBase;

           // The replacement image is already decoded.
           setPage(
             card,
             nextPage(card.data.src)
           );

           // Reset instantly, outside the viewport.
           paint(card, true);

         } else {
           // Ordinary climbing movement.
           paint(card, false);
         }
       });
     });
   }

   function begin(paths) {
     var seen = Object.create(null);

     var unique = paths.filter(function (src) {
       if (
         typeof src !== 'string' ||
         !src.trim() ||
         seen[src]
       ) {
         return false;
       }

       seen[src] = true;
       return true;
     });

     var selected = shuffle(unique);

     // Decode the first group before showing pages.
     Promise.all(
       selected.slice(0, 18).map(preload)
     ).then(function (first) {

       pool = shuffle(first.filter(Boolean));

       if (!pool.length) return;

       rebuild();

       if (!started) {
         started = true;

         // Keep the original climbing rhythm.
         window.setInterval(advance, 630);

         window.addEventListener(
           'resize',
           function () {
             clearTimeout(resizeTimer);

             resizeTimer = setTimeout(
               rebuild,
               200
             );
           },
           { passive: true }
         );
       }

       // Load additional zine pages without
       // interrupting the running animation.
       Promise.all(
         selected.slice(18).map(preload)
       ).then(function (rest) {
         pool = shuffle(
           pool.concat(rest.filter(Boolean))
         );
       });
     });
   }

   fetch('content.json')
     .then(function (r) {
       if (!r.ok) {
         throw new Error('Missing content.json');
       }

       return r.json();
     })
     .then(function (data) {
       var paths = Array.isArray(data.border)
         ? data.border.map(function (item) {
             return item && item.image;
           })
         : [];

       begin(
         paths.length ? paths : FALLBACK
       );
     })
     .catch(function () {
       begin(FALLBACK);
     });
 })();
