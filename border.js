
 // Zine pages along the edges of the homepage.
 // Original animation with targeted spacing and recycling fixes.
 (function () {
   var staticPages = [
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

   var pages = staticPages.slice();
   var phone = window.innerWidth < 700;
   var reduce = false;

   try {
     reduce = window.matchMedia(
       '(prefers-reduced-motion: reduce)'
     ).matches;
   } catch (e) {}

   // Original sparse number of pages.
   var count = phone ? 3 : 8;
   var cards = [];
   var ratios = {};
   var cursor = Math.floor(Math.random() * pages.length);

   function random(a, b) {
     return a + Math.random() * (b - a);
   }

   function clamp(n, a, b) {
     return Math.max(a, Math.min(b, n));
   }

   function nextImage() {
     cursor = (
       cursor + 1 + Math.floor(Math.random() * 7)
     ) % pages.length;

     return pages[cursor];
   }

   // Prevent narrow pages from wandering entirely
   // outside the visible edge of the screen.
   function keepOnEdge(c) {
     var edge = c.box.parentNode.getBoundingClientRect();
     var visible = phone ? 30 : 55;

     if (c.side === 'left') {
       c.x = Math.max(
         c.x,
         visible - edge.left - c.width
       );
     } else {
       c.x = Math.min(
         c.x,
         window.innerWidth - visible - edge.left
       );
     }
   }

   function show(c, instant) {
     keepOnEdge(c);

     var transition = reduce
       ? 'none'
       : 'transform 690ms ease-out, width 690ms ease-out';

     c.box.style.transition =
       (instant || reduce) ? 'none' : transition;

     c.box.style.width = c.width + 'px';

     c.box.style.transform =
       'translate(' +
       Math.round(c.x) + 'px,' +
       Math.round(c.y) + 'px) rotate(' +
       c.turn + 'deg)';

     // Prevent a recycled page from visibly
     // flying across the screen.
     if (instant && !reduce) {
       void c.box.offsetHeight;
       c.box.style.transition = transition;
     }
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

       var width = phone
         ? random(95, 155)
         : random(165, 320);

       var c = {
         box: box,
         img: img,
         side: side,
         width: width,
         x: random(-28, 35),
         y: phone
           ? n * 270 - 130
           : n * 180 - 320,
         ratio: 1.4,
         height: width * 1.4,
         turn: random(-17, 17),
         speed: phone
           ? random(45, 90)
           : random(65, 120),
         retries: 0,
         reset: false
       };

       cards.push(c);

       (function (card) {
         img.onload = function () {
           if (img.naturalWidth && img.naturalHeight) {
             card.ratio =
               img.naturalHeight / img.naturalWidth;

             ratios[img.getAttribute('src')] =
               card.ratio;

             card.height = card.width * card.ratio;
           }
         };

         img.onerror = function () {
           if (card.retries < 3) {
             card.retries++;
             img.src = nextImage();
           }
         };
       })(c);

       img.src = nextImage();
       show(c, true);
     }
   }

   make('left');
   make('right');

   // Keep automatically generated zine pages.
   fetch('content.json')
     .then(function (res) {
       if (!res.ok) {
         throw new Error('Unable to load content.json');
       }
       return res.json();
     })
     .then(function (data) {
       if (data.border && data.border.length) {
         var incoming = [];

         for (var j = 0; j < data.border.length; j++) {
           if (data.border[j].image) {
             incoming.push(data.border[j].image);
           }
         }

         if (incoming.length) pages = incoming;
       }
     })
     .catch(function () {});

   // Reduced motion leaves the original collage still.
   if (reduce) return;

   var last = Date.now();

   function advance() {
     var now = Date.now();

     if (document.hidden) {
       last = now;
       return;
     }

     var elapsed = Math.min(
       (now - last) / 630,
       1.5
     );

     last = now;

     for (var k = 0; k < cards.length; k++) {
       var c = cards[k];
       c.reset = false;

       // Original independent climbing motion.
       c.y -= c.speed * elapsed;

       // Original sideways movement.
       c.x += random(
         phone ? -9 : -28,
         phone ? 9 : 28
       );

       c.x = clamp(
         c.x,
         phone ? -35 : -90,
         phone ? 55 : 125
       );

       // Original irregular rotation.
       c.turn = clamp(
         c.turn + random(-8, 8),
         -27,
         27
       );

       // Original occasional size changes.
       if (!phone && Math.random() < 0.13) {
         c.width = clamp(
           c.width + random(-32, 32),
           155,
           340
         );

         // FIX: Update the actual page height.
         c.height = c.width * c.ratio;
       }

       // FIX: Wait until the rotated page has
       // completely exited above the screen.
       if (
         c.y + c.height + c.width * 0.25 < -35
       ) {
         // FIX: Re-enter just below the screen
         // instead of waiting 20–220 extra pixels.
         c.y = window.innerHeight + random(8, 32);

         c.x = random(-20, 55);

         c.width = phone
           ? random(95, 155)
           : random(165, 320);

         c.retries = 0;

         var src = nextImage();

         c.ratio = ratios[src] || 1.4;
         c.height = c.width * c.ratio;
         c.img.src = src;

         c.reset = true;
       }
     }

     // FIX: Allow natural empty space, but don't let
     // enormous gaps accumulate between pages.
     ['left', 'right'].forEach(function (side) {
       var column = cards.filter(function (card) {
         return card.side === side;
       });

       column.sort(function (a, b) {
         return a.y - b.y;
       });

       // Deliberately generous spacing.
       // The border should NOT look crowded.
       var maxGap = phone ? 145 : 125;

       for (var j = 1; j < column.length; j++) {
         var above = column[j - 1];
         var below = column[j];

         var gap =
           below.y - (above.y + above.height);

         if (gap > maxGap) {
           // Small correction rather than a teleport.
           below.y -= Math.min(
             30,
             gap - maxGap
           );
         }
       }
     });

     for (var m = 0; m < cards.length; m++) {
       show(cards[m], cards[m].reset);
     }
   }

   window.setInterval(advance, 630);
 })();
