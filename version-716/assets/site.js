(function () {
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuToggle && mobilePanel) {
    menuToggle.addEventListener('click', function () {
      mobilePanel.classList.toggle('is-open');
    });
  }

  const hero = document.querySelector('[data-hero-carousel]');

  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    let current = 0;

    const showSlide = function (index) {
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
    };

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        const index = Number(dot.getAttribute('data-hero-dot'));
        showSlide(index);
      });
    });

    window.setInterval(function () {
      if (!document.hidden) {
        showSlide(current + 1);
      }
    }, 5600);
  }

  const searchInputs = Array.from(document.querySelectorAll('[data-search-input]'));

  const runSearch = function (value) {
    const keyword = value.trim().toLowerCase();
    const cards = Array.from(document.querySelectorAll('.movie-card, .rank-row'));
    const grids = Array.from(document.querySelectorAll('[data-card-grid]'));

    cards.forEach(function (card) {
      const haystack = [
        card.getAttribute('data-title') || '',
        card.getAttribute('data-genre') || '',
        card.getAttribute('data-tags') || '',
        card.getAttribute('data-year') || '',
        card.textContent || ''
      ].join(' ').toLowerCase();

      card.classList.toggle('is-hidden-card', Boolean(keyword) && !haystack.includes(keyword));
    });

    grids.forEach(function (grid) {
      let visible = Array.from(grid.querySelectorAll('.movie-card')).some(function (card) {
        return !card.classList.contains('is-hidden-card');
      });

      let marker = grid.querySelector('.no-results');

      if (!visible && keyword) {
        if (!marker) {
          marker = document.createElement('div');
          marker.className = 'no-results';
          marker.textContent = '没有找到匹配影片';
          grid.appendChild(marker);
        }
      } else if (marker) {
        marker.remove();
      }
    });
  };

  searchInputs.forEach(function (input) {
    input.addEventListener('input', function () {
      searchInputs.forEach(function (other) {
        if (other !== input) {
          other.value = input.value;
        }
      });

      runSearch(input.value);
    });
  });

  const setupPlayers = function () {
    const players = Array.from(document.querySelectorAll('[data-stream]'));

    players.forEach(function (shell) {
      const video = shell.querySelector('video');
      const cover = shell.querySelector('.play-cover');
      const stream = shell.getAttribute('data-stream');
      let ready = false;
      let hls = null;

      if (!video || !stream) {
        return;
      }

      const attachStream = function () {
        if (ready) {
          return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
          ready = true;
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
          ready = true;
          return;
        }

        video.src = stream;
        ready = true;
      };

      const startVideo = function () {
        attachStream();

        if (cover) {
          cover.classList.add('is-hidden');
        }

        const playPromise = video.play();

        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(function () {
            video.controls = true;
          });
        }
      };

      if (cover) {
        cover.addEventListener('click', startVideo);
      }

      video.addEventListener('click', function () {
        if (video.paused) {
          startVideo();
        }
      });

      window.addEventListener('beforeunload', function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPlayers);
  } else {
    setupPlayers();
  }
}());
