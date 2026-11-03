
// Baton Rouge Alternative — seamless zine-page border.
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

  if (document.getElementById('bralt-paper-border-style')) {
    return;
  }

  // Isolated CSS avoids conflicts with the older
  // .border-stream and .floating-page rules.
  var style = document.createElement('style');
  style.id = 'bralt-paper-border-style';
  style.textContent = [
    '.bralt-paper-rail{position:fixed;top:0;bottom:0;',
    'width:clamp(170px,20vw,320px);overflow:hidden;',
    'pointer-events:none;z-index:0;opacity:.73;',
    'isolation:isolate}',
    '.bralt-paper-rail--left{left:0}',
    '.bralt-paper-rail--right{right:0}',
    '.bralt-paper-track{display:flex;flex-direction:column;',
    'will-change:transform;animation:bralt-paper-scroll ',
    'var(--bralt-paper-duration) linear infinite}',
    '.bralt-paper-cycle{display:flex;flex-direction:column;',
    'flex:none;min-height:0}',
    '.bralt-paper-item{position:relative;display:block;',
    'flex:none;transform-origin:center center}',
    '.bralt-paper-item img{display:block;width:100%;',
    'height:100%;object-fit:fill;filter:grayscale(1) ',
    'contrast(1.12);box-shadow:0 3px 12px #0008}',
    '@keyframes bralt-paper-scroll{',
    'from{transform:translate3d(0,0,0)}',
    'to{transform:translate3d(0,-50%,0)}}',
    '@media(max-width:1200px){.bralt-paper-rail{',
    'opacity:.51;width:clamp(145px,19vw,250px)}}',
    '@media(max-width:700px){.bralt-paper-rail{',
    'width:clamp(112px,32vw,164px);opacity:.4}}',
    '@media(prefers-reduced-motion:reduce){',
    '.bralt-paper-track{animation:none}}'
  ].join('');

  document.head.appendChild(style);

  var loaded = [];
  var rails = [];
  var resizeHandle = null;

  function random(a, b) {
    return a + Math.random() * (b - a);
  }

  function shuffle(input) {
    var items = input.slice();

    for (var i = items.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = items[i];
      items[i] = items[j];
      items[j] = temp;
    }

    return items;
  }

  // Load and decode the page before using it.
  function preload(src) {
    return new Promise(function (resolve) {
      var image = new Image();

      image.onload = function () {
        var ready = function () {
          resolve({
            src: src,
            ratio: image.naturalHeight / image.naturalWidth
          });
        };

        if (typeof image.decode === 'function') {
          image.decode().then(ready, ready);
        } else {
          ready();
        }
      };

      image.onerror = function () {
        resolve(null);
      };

      image.src = src;
    });
  }

  function itemNode(data, width, left, gap, angle) {
    var item = document.createElement('div');
    item.className = 'bralt-paper-item';

    item.style.width = width + 'px';
    item.style.height =
      Math.round(width * data.ratio) + 'px';
    item.style.marginLeft = left + 'px';
    item.style.marginBottom = gap + 'px';
    item.style.transform =
      'rotate(' + angle.toFixed(2) + 'deg)';

    var img = document.createElement('img');
    img.src = data.src;
    img.alt = '';
    img.loading = 'eager';
    img.decoding = 'async';

    item.appendChild(img);
    return item;
  }

  function createRail(side, pool) {
    var rail = document.createElement('div');

    rail.className =
      'bralt-paper-rail bralt-paper-rail--' + side;

    rail.setAttribute('aria-hidden', 'true');
    document.body.appendChild(rail);
    rails.push(rail);

    var railWidth = rail.getBoundingClientRect().width;
    var narrow = window.innerWidth <= 700;

    // Ensure each strip is longer than the viewport.
    var minHeight = Math.max(
      1250,
      window.innerHeight * 1.7 + 350
    );

    var minItems = narrow ? 15 : 13;

    var cycle = document.createElement('div');
    cycle.className = 'bralt-paper-cycle';

    var total = 0;
    var index = 0;
    var chosen = shuffle(pool);

    // Fill the strip with actual image dimensions.
    // Pages stay assigned to their images permanently.
    while (
      (total < minHeight || index < minItems) &&
      index < 100
    ) {
      if (
        index > 0 &&
        index % chosen.length === 0
      ) {
        chosen = shuffle(pool);
      }

      var data = chosen[index % chosen.length];

      var width = Math.round(
        railWidth * random(
          narrow ? .7 : .65,
          narrow ? .92 : .94
        )
      );

      var offset = Math.round(
        random(
          3,
          Math.max(4, railWidth - width - 4)
        )
      );

      var gap = Math.round(
        random(
          narrow ? 9 : 11,
          narrow ? 22 : 26
        )
      );

      var angle = random(-10, 10);

      cycle.appendChild(
        itemNode(data, width, offset, gap, angle)
      );

      total += Math.round(width * data.ratio) + gap;
      index++;
    }

    // Two identical strips form one endless loop.
    var track = document.createElement('div');
    track.className = 'bralt-paper-track';

    track.appendChild(cycle);
    track.appendChild(cycle.cloneNode(true));
    rail.appendChild(track);

    // Duration is calculated from the actual strip height.
    var measured = cycle.getBoundingClientRect().height;
    var speed = narrow ? 58 : 76;

    track.style.setProperty(
      '--bralt-paper-duration',
      (measured / speed).toFixed(3) + 's'
    );
  }

  function build() {
    rails.forEach(function (rail) {
      rail.remove();
    });

    rails = [];

    if (!loaded.length) return;

    createRail('left', loaded);
    createRail('right', loaded);
  }

  function start(paths) {
    var unique = Array.from(
      new Set(
        paths.filter(function (src) {
          return typeof src === 'string' && src.trim();
        })
      )
    );

    // Preload a bounded set, avoiding unnecessary downloads.
    var selection = shuffle(unique).slice(0, 32);

    Promise.all(selection.map(preload)).then(
      function (results) {
        loaded = results.filter(Boolean);

        if (!loaded.length) return;

        build();

        // Recalculate sizes after a window resize.
        window.addEventListener(
          'resize',
          function () {
            window.clearTimeout(resizeHandle);
            resizeHandle = window.setTimeout(build, 200);
          },
          { passive: true }
        );

        // Prevent background tab time jumps.
        document.addEventListener(
          'visibilitychange',
          function () {
            rails.forEach(function (rail) {
              var track = rail.querySelector(
                '.bralt-paper-track'
              );

              if (track) {
                track.style.animationPlayState =
                  document.hidden ? 'paused' : 'running';
              }
            });
          }
        );
      }
    );
  }

  // Read the generated border-image catalog.
  fetch('content.json')
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Failed to load border content');
      }
      return response.json();
    })
    .then(function (data) {
      var paths = Array.isArray(data.border)
        ? data.border.map(function (item) {
            return item && item.image;
          })
        : [];

      start(paths.length ? paths : FALLBACK);
    })
    .catch(function () {
      start(FALLBACK);
    });
})();
