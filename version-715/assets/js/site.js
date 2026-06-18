(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
      });
    });

    window.setInterval(function () {
      showSlide(current + 1);
    }, 5200);
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function updateList(container) {
    var cards = Array.prototype.slice.call(container.querySelectorAll('[data-card]'));
    var scope = container.closest('.container') || document;
    var search = normalize(scope.querySelector('[data-search-input]') && scope.querySelector('[data-search-input]').value);
    var region = normalize(scope.querySelector('[data-region-filter]') && scope.querySelector('[data-region-filter]').value);
    var type = normalize(scope.querySelector('[data-type-filter]') && scope.querySelector('[data-type-filter]').value);
    var empty = scope.querySelector('[data-empty-state]');
    var visible = 0;

    cards.forEach(function (card) {
      var haystack = normalize([
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-type'),
        card.getAttribute('data-genre'),
        card.getAttribute('data-year')
      ].join(' '));
      var cardRegion = normalize(card.getAttribute('data-region'));
      var cardType = normalize(card.getAttribute('data-type'));
      var matched = (!search || haystack.indexOf(search) !== -1) && (!region || cardRegion === region) && (!type || cardType === type);
      card.classList.toggle('is-hidden', !matched);
      if (matched) {
        visible += 1;
      }
    });

    if (empty) {
      empty.classList.toggle('is-visible', visible === 0);
    }
  }

  function sortList(container, mode) {
    var cards = Array.prototype.slice.call(container.querySelectorAll('[data-card]'));
    var sorted = cards.slice();

    if (mode === 'year-desc') {
      sorted.sort(function (a, b) {
        return Number(b.getAttribute('data-year')) - Number(a.getAttribute('data-year'));
      });
    } else if (mode === 'year-asc') {
      sorted.sort(function (a, b) {
        return Number(a.getAttribute('data-year')) - Number(b.getAttribute('data-year'));
      });
    } else if (mode === 'title-asc') {
      sorted.sort(function (a, b) {
        return String(a.getAttribute('data-title')).localeCompare(String(b.getAttribute('data-title')), 'zh-CN');
      });
    } else {
      sorted.sort(function (a, b) {
        return cards.indexOf(a) - cards.indexOf(b);
      });
    }

    sorted.forEach(function (card) {
      container.appendChild(card);
    });
  }

  document.querySelectorAll('[data-card-list]').forEach(function (container) {
    var scope = container.closest('.container') || document;
    var controls = Array.prototype.slice.call(scope.querySelectorAll('[data-search-input], [data-region-filter], [data-type-filter]'));
    var sortSelect = scope.querySelector('[data-sort-select]');

    controls.forEach(function (control) {
      control.addEventListener('input', function () {
        updateList(container);
      });
      control.addEventListener('change', function () {
        updateList(container);
      });
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        sortList(container, sortSelect.value);
        updateList(container);
      });
    }
  });
})();

function bindMoviePlayer(videoId, overlayId, source) {
  var video = document.getElementById(videoId);
  var overlay = document.getElementById(overlayId);
  var attached = false;
  var hls = null;

  if (!video || !overlay || !source) {
    return;
  }

  function start() {
    overlay.classList.add('is-hidden');

    if (!attached) {
      attached = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.play().catch(function () {});
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MEDIA_ATTACHED, function () {
          hls.loadSource(source);
        });
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(function () {});
        });
      } else {
        video.src = source;
        video.play().catch(function () {});
      }
    } else {
      video.play().catch(function () {});
    }
  }

  overlay.addEventListener('click', start);
  overlay.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      start();
    }
  });
  video.addEventListener('click', function () {
    if (!attached) {
      start();
    }
  });
  window.addEventListener('beforeunload', function () {
    if (hls) {
      hls.destroy();
    }
  });
}
