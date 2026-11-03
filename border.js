
// Continuous zine-page collage along both sides of the homepage.
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
  var reducedMotion = false;

  try {
    reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
  } catch (e) {}

  // Page spacing and movement speed.
  var PAGE_HEIGHT = 215;
  var SPACING = phone ? 230 : 195;
  var SPEED = phone ? 68 : 95;

  // Automatically create enough pages for tall screens.
  var COUNT = Math.max(
    phone ? 5 : 8,
    Math.ceil(
      (window.innerHeight + 2 * PAGE_HEIGHT) / SPACING
    ) + 1
  );

  var columns = { left: [], right: [] };
  var cursor = Math.floor(Math.random() * pages.length);

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function nextImage() {
    cursor = (
      cursor + 1 + Math.floor(Math.random() * 7)
    ) % pages.length;

    return pages[cursor];
  }

  // Gentle horizontal swaying without disturbing vertical spacing.
  function position(card, time) {
    var sway = reducedMotion
      ? 0
      : Math.sin(time / 1800 + card.phase) * 12;

    var tilt = reducedMotion
      ? 0
      : Math.sin(time / 2500 + card.phase) * 4;

    card.box.style.transform =
      'translate3d(' +
      Math.round(card.x + sway) + 'px,' +
      Math.round(card.y) + 'px,0) rotate(' +
      (card.turn + tilt).toFixed(2) + 'deg)';
  }

  function createColumn(side) {
    var rail = document.createElement('div');
    rail.className = 'border-stream ' + side;
    rail.setAttribute('aria-hidden', 'true');

    document.body.appendChild(rail);

    for (var i = 0; i < COUNT; i++) {
      var box = document.createElement('div');
      box.className = 'floating-page';

      // Disable transitions for smooth frame-by-frame movement.
      box.style.transition = 'none';
      box.style.width = (
        phone ? random(95, 155) : random(165, 320)
      ) + 'px';

      var img = document.createElement('img');
      img.alt = '';
      img.loading = 'eager';
      img.decoding = 'async';

      box.appendChild(img);
      rail.appendChild(box);

      var card = {
        box: box,
        img: img,
        x: random(-28, 35),
        y: -PAGE_HEIGHT + i * SPACING,
        turn: random(-17, 17),
        phase: random(0, Math.PI * 2),
        retries: 0
      };

      columns[side].push(card);

      // Retry another page image if one fails to load.
      (function (item) {
        item.img.onerror = function () {
          if (item.retries++ < 5) {
            item.img.src = nextImage();
          }
        };
      })(card);

      img.src = nextImage();
      position(card, 0);
    }
  }

  createColumn('left');
  createColumn('right');

  // Load dynamically generated pages.
  fetch('content.json')
    .then(function (res) {
      if (!res.ok) {
        throw new Error('Could not load content.json');
      }
      return res.json();
    })
    .then(function (data) {
      if (!Array.isArray(data.border)) return;

      var incoming = data.border
        .filter(function (item) {
          return item && item.image;
        })
        .map(function (item) {
          return item.image;
        });

      if (incoming.length) {
        pages = incoming;
      }
    })
    .catch(function () {});

  // Respect reduced-motion accessibility preferences.
  if (reducedMotion) return;

  var previousTime = 0;

  function animate(time) {
    if (!previousTime) {
      previousTime = time;
    }

    var delta = Math.min(
      (time - previousTime) / 1000,
      0.05
    );

    previousTime = time;

    if (!document.hidden) {
      ['left', 'right'].forEach(function (side) {
        var column = columns[side];

        // All pages travel upward at the same speed.
        for (var i = 0; i < column.length; i++) {
          column[i].y -= SPEED * delta;
        }

        for (var j = 0; j < column.length; j++) {
          var card = column[j];

          // Recycle pages immediately after the last page.
          // Prevents random gaps and disappearing stretches.
          if (card.y + PAGE_HEIGHT < 0) {
            var tail = -Infinity;

            for (var k = 0; k < column.length; k++) {
              if (column[k] !== card) {
                tail = Math.max(
                  tail,
                  column[k].y
                );
              }
            }

            card.y = tail + SPACING;
            card.x = random(-28, 35);
            card.turn = random(-17, 17);
            card.phase = random(
              0,
              Math.PI * 2
            );

            card.box.style.width = (
              phone
                ? random(95, 155)
                : random(165, 320)
            ) + 'px';

            card.retries = 0;
            card.img.src = nextImage();
          }

          position(card, time);
        }
      });
    }

    window.requestAnimationFrame(animate);
  }

  window.requestAnimationFrame(animate);
})();
