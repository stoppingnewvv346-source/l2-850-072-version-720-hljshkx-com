(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupNavigation() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".site-nav");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, position) {
        var active = position === current;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", active ? "false" : "true");
      });
      dots.forEach(function (dot, position) {
        dot.classList.toggle("is-active", position === current);
      });
    }

    function play() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        play();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        play();
      });
    }
    dots.forEach(function (dot, position) {
      dot.addEventListener("click", function () {
        show(position);
        play();
      });
    });
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", play);
    show(0);
    play();
  }

  function setupCardFilters() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll("[data-filter-input]"));
    inputs.forEach(function (input) {
      var section = input.closest("main") || document;
      var cards = Array.prototype.slice.call(section.querySelectorAll("[data-card-search]"));
      input.addEventListener("input", function () {
        var value = input.value.trim().toLowerCase();
        cards.forEach(function (card) {
          var text = (card.getAttribute("data-card-search") || "").toLowerCase();
          card.classList.toggle("is-hidden", value && text.indexOf(value) === -1);
        });
      });
    });
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>\"]/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;"
      }[character];
    });
  }

  function movieCard(movie) {
    var title = escapeHtml(movie.title);
    var meta = escapeHtml([movie.year, movie.region, movie.genre].filter(Boolean).join(" · "));
    return [
      "<a class=\"movie-card\" href=\"./" + escapeHtml(movie.file) + "\">",
      "  <span class=\"card-media\">",
      "    <img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + title + "\">",
      "    <span class=\"card-play\">▶</span>",
      "    <span class=\"card-year\">" + escapeHtml(movie.year) + "</span>",
      "  </span>",
      "  <span class=\"card-body\">",
      "    <span class=\"card-title\">" + title + "</span>",
      "    <span class=\"card-meta\">" + meta + "</span>",
      "  </span>",
      "</a>"
    ].join("");
  }

  function setupSearchPage() {
    var results = document.getElementById("search-results");
    var input = document.querySelector("[data-search-input]");
    var summary = document.querySelector("[data-search-summary]");
    if (!results || !input || !window.MOVIES) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    input.value = initial;

    function render() {
      var query = input.value.trim().toLowerCase();
      var list = window.MOVIES.filter(function (movie) {
        if (!query) {
          return false;
        }
        return movie.search.indexOf(query) !== -1;
      }).slice(0, 120);
      results.innerHTML = list.map(movieCard).join("");
      if (summary) {
        if (!query) {
          summary.textContent = "输入关键词后显示结果";
        } else if (list.length) {
          summary.textContent = "已找到相关内容";
        } else {
          summary.textContent = "暂无匹配内容";
        }
      }
    }

    input.addEventListener("input", render);
    render();
  }

  function initMoviePlayer(videoId, playId, source) {
    var video = document.getElementById(videoId);
    var play = document.getElementById(playId);
    if (!video || !play || !source) {
      return;
    }
    var frame = video.closest(".video-frame");
    var status = document.querySelector(".player-status");
    var attached = false;
    var hls = null;

    function setStatus(message) {
      if (status) {
        status.textContent = message || "";
      }
    }

    function attach() {
      if (attached) {
        return Promise.resolve();
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        attached = true;
        return Promise.resolve();
      }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setStatus("播放遇到问题，请稍后再试。");
          }
        });
        attached = true;
        return Promise.resolve();
      }
      setStatus("播放遇到问题，请稍后再试。");
      return Promise.reject(new Error("playback unavailable"));
    }

    function start() {
      setStatus("");
      attach().then(function () {
        if (frame) {
          frame.classList.add("is-ready");
        }
        return video.play();
      }).then(function () {
        if (frame) {
          frame.classList.add("is-playing");
        }
      }).catch(function () {
        setStatus("播放遇到问题，请稍后再试。");
      });
    }

    play.addEventListener("click", start);
    video.addEventListener("click", function () {
      if (!attached || video.paused) {
        start();
      } else {
        video.pause();
      }
    });
    video.addEventListener("play", function () {
      if (frame) {
        frame.classList.add("is-playing");
      }
    });
    video.addEventListener("pause", function () {
      if (frame) {
        frame.classList.remove("is-playing");
      }
    });
    window.addEventListener("beforeunload", function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  window.initMoviePlayer = initMoviePlayer;

  ready(function () {
    setupNavigation();
    setupHero();
    setupCardFilters();
    setupSearchPage();
  });
})();
