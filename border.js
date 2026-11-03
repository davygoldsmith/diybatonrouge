
 // Baton Rouge Alternative — independent, climbing zine pages.
 // Replace border.js only. The border styles are isolated from extra.css.
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

   if (document.getElementById('bralt-crawl-style')) return;

   var style = document.createElement('style');
   style.id = 'bralt-crawl-style';
   style.textContent = [
     '.bralt-crawl-rail{position:fixed;top:0;bottom:0;',
     'width:clamp(215px,22vw,365px);overflow:hidden;',
     'z-index:0;pointer-events:none;opacity:.72;contain:layout style}',
     '.bralt-crawl-rail--left{left:-35px}',
     '.bralt-crawl-rail--right{right:-35px}',
     '.bralt-crawl-card{position:absolute;left:0;top:0;',
     'transform-origin:center center;will-change:transform;',
     'transition:transform 430ms cubic-bezier(.16,.75,.24,1),',
     'width 430ms ease,height 430ms ease}',
     '.bralt-crawl-card img{display:block;width:100%;height:100%;',
     'object-fit:fill;filter:grayscale(1) contrast(1.12);',
     'box-shadow:0 2px 12px #0008}',
     '@media(max-width:1200px){.bralt-crawl-rail{',
     'width:clamp(175px,23vw,280px);opacity:.48}}',
     '@media(max-width:700px){.bralt-crawl-rail{',
     'width:clamp(150px,43vw,200px);opacity:.38}',
     '.bralt-crawl-rail--left{left:-83px}',
     '.bralt-crawl-rail--right{right:-83px}}',
     '@media(prefers-reduced-motion:reduce){',
     '.bralt-crawl-card{transition:none}}'
   ].join('');
   document.head.appendChild(style);

   var reduced = false;
   try {
     reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   } catch (e) {}

   var pool = [];
   var rails = [];
   var running = false;
   var imageCursor = 0;

   function random(a, b) {
     return a + Math.random() * (b - a);
   }

   function between(x, a, b) {
     return Math.max(a, Math.min(b, x));
   }

   function shuffle(array) {
     var result = array.slice();
     for (var i = result.length - 1; i > 0; i--) {
       var j = Math.floor(Math.random() * (i + 1));
       var hold = result[i];
       result[i] = result[j];
       result[j] = hold;
     }
     return result;
   }

   function nextPage() {
     if (!pool.length) return null;
     imageCursor = (
       imageCursor + 1 + Math.floor(random(0, 7))
     ) % pool.length;
     return pool[imageCursor];
   }

   function preload(src) {
     return new Promise(function (resolve) {
       var img = new Image();

       img.onload = function () {
         if (!img.naturalWidth || !img.naturalHeight) {
           return resolve(null);
         }

         var done = function () {
           resolve({
             src: src,
             ratio: img.naturalHeight / img.naturalWidth
           });
         };

         if (img.decode) {
           img.decode().then(done, done);
         } else {
           done();
         }
       };

       img.onerror = function () {
         resolve(null);
       };
       img.src = src;
     });
   }

   function chooseWidth(rail) {
     var mobile = window.innerWidth < 701;
     return Math.round(
       rail.width * random(
         mobile ? .70 : .55,
         mobile ? 1.00 : 1.02
       )
     );
   }

   function chooseX(rail, width) {
     return Math.round(
       random(-10, Math.max(5, rail.width - width + 5))
     );
   }

   function apply(card, instant) {
     var el = card.el;

     if (instant) el.style.transition = 'none';

     el.style.width = Math.round(card.width) + 'px';
     el.style.height = Math.round(card.height) + 'px';
     el.style.transform =
       'translate3d(' +
       Math.round(card.x) + 'px,' +
       Math.round(card.y) + 'px,0) rotate(' +
       card.angle.toFixed(1) + 'deg)';

     if (instant) {
       // Reposition offscreen without animating across the page.
       void el.offsetHeight;
       el.style.transition = '';
     }
   }

   function newCard(rail, y) {
     var data = nextPage();
     if (!data) return null;

     var width = chooseWidth(rail);
     var el = document.createElement('div');
     el.className = 'bralt-crawl-card';

     var img = document.createElement('img');
     img.alt = '';
     img.decoding = 'async';
     img.loading = 'eager';
     img.src = data.src;

     el.appendChild(img);
     rail.node.appendChild(el);

     var card = {
       rail: rail,
       el: el,
       img: img,
       data: data,
       x: chooseX(rail, width),
       y: y,
       width: width,
       height: width * data.ratio,
       angle: random(-17, 17),
       due: performance.now() + random(70, 520)
     };

     rail.cards.push(card);
     apply(card, true);
     return card;
   }

   function appendAfterLast(rail) {
     var tail = rail.cards.reduce(function (a, b) {
       return !a || b.y > a.y ? b : a;
     }, null);

     // Overlap neighboring pages to protect against gaps.
     var y = tail
       ? tail.y + tail.height * .50
       : -320;

     return newCard(rail, y);
   }

   function ensureCoverage(rail) {
     var need = window.innerHeight + 340;
     var bottom = -Infinity;

     rail.cards.forEach(function (c) {
       bottom = Math.max(bottom, c.y + c.height);
     });

     // Queue replacement pages before the bottom becomes empty.
     var safety = 0;
     while (bottom < need && safety++ < 80) {
       var card = appendAfterLast(rail);
       if (!card) break;
       bottom = Math.max(bottom, card.y + card.height);
     }
   }

   function makeRail(side) {
     var node = document.createElement('div');
     node.className =
       'bralt-crawl-rail bralt-crawl-rail--' + side;
     node.setAttribute('aria-hidden', 'true');
     document.body.appendChild(node);

     var rail = {
       node: node,
       width: node.getBoundingClientRect().width,
       cards: []
     };

     rails.push(rail);
     newCard(rail, -320);
     ensureCoverage(rail);
   }

   function recycle(rail, card) {
     var tail = rail.cards.reduce(function (a, b) {
       return b !== card && (!a || b.y > a.y)
         ? b : a;
     }, null);

     var data = nextPage();
     if (!tail || !data) return;

     card.data = data;
     card.width = chooseWidth(rail);
     card.height = card.width * data.ratio;

     card.y = tail.y + tail.height * .50;
     card.x = chooseX(rail, card.width);
     card.angle = random(-17, 17);
     card.due = performance.now() + random(100, 520);

     // Change the image only once the page has left the screen.
     card.img.src = data.src;
     apply(card, true);
   }

   function crawl(now) {
     if (!document.hidden && !reduced) {
       rails.forEach(function (rail) {
         var ordered = rail.cards.slice().sort(
           function (a, b) {
             return a.y - b.y;
           }
         );

         // Each page climbs at its own pace.
         ordered.forEach(function (card, i) {
           if (now < card.due) return;

           card.due = now + random(300, 535);

           var before = ordered[i - 1];
           var after = ordered[i + 1];
           var width = card.width;

           // Occasionally grow or shrink while climbing.
           if (Math.random() < .28) {
             var candidate = between(
               width + random(-18, 18),
               rail.width * .57,
               rail.width * 1.02
             );

             if (
               !after ||
               after.y <=
                 card.y + candidate * card.data.ratio - 28
             ) {
               width = candidate;
             }
           }

           var height = width * card.data.ratio;

           // Fast, irregular upward movements.
           var destination = card.y - random(40, 86);

           // Don't allow a gap beneath this page.
           if (after) {
             destination = Math.max(
               destination,
               after.y - height + 42
             );
           }

           // Don't overtake the page directly above.
           if (before) {
             destination = Math.max(
               destination,
               before.y + Math.min(
                 65,
                 before.height * .24
               )
             );
           }

           if (destination < card.y - 1) {
             card.y = destination;
             card.width = width;
             card.height = height;

             // Random sideways jolts.
             card.x = between(
               card.x + random(-38, 38),
               -12,
               Math.max(5, rail.width - width + 10)
             );

             // Little climbing rotations.
             card.angle = between(
               card.angle + random(-12, 12),
               -24,
               24
             );

             apply(card, false);
           }
         });

         // Replace only after the entire old page is gone.
         ordered.forEach(function (card) {
           if (
             card.y +
             card.height +
             card.width * .26 < -75
           ) {
             recycle(rail, card);
           }
         });

         ensureCoverage(rail);
       });
     } else if (document.hidden) {
       // Avoid a huge catch-up jump when returning to the tab.
       rails.forEach(function (rail) {
         rail.cards.forEach(function (c) {
           c.due = now + random(90, 510);
         });
       });
     }

     window.requestAnimationFrame(crawl);
   }

   function rebuild() {
     rails.forEach(function (rail) {
       rail.node.remove();
     });

     rails = [];
     if (!pool.length) return;

     imageCursor = Math.floor(random(0, pool.length));
     makeRail('left');
     makeRail('right');
   }

   function start(paths) {
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

     // Preload and decode pages before the animation starts.
     Promise.all(
       shuffle(unique).slice(0, 35).map(preload)
     ).then(function (results) {
       pool = shuffle(results.filter(Boolean));
       if (!pool.length) return;

       rebuild();

       if (!running) {
         running = true;
         window.requestAnimationFrame(crawl);

         var resizeTimer;
         window.addEventListener(
           'resize',
           function () {
             clearTimeout(resizeTimer);
             resizeTimer = setTimeout(rebuild, 220);
           },
           { passive: true }
         );
       }
     });
   }

   fetch('content.json')
     .then(function (response) {
       if (!response.ok) {
         throw new Error('Could not fetch content.json');
       }
       return response.json();
     })
     .then(function (data) {
       var entries = Array.isArray(data.border)
         ? data.border
         : [];

       var paths = entries.map(function (entry) {
         return entry && entry.image;
       });

       start(paths.length ? paths : FALLBACK);
     })
     .catch(function () {
       start(FALLBACK);
     });
 })();
