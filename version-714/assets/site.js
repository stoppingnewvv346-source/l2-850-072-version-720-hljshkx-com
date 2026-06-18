(function () {
  "use strict";

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function initMobileMenu() {
    var toggle = qs("[data-menu-toggle]");
    var nav = qs("[data-mobile-nav]");
    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function initHeroCarousel() {
    var carousel = qs("[data-hero-carousel]");
    if (!carousel) {
      return;
    }

    var slides = qsa("[data-hero-slide]", carousel);
    var dots = qsa("[data-hero-dot]", carousel);
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      if (slides.length <= 1) {
        return;
      }
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        window.clearInterval(timer);
        show(index);
        start();
      });
    });

    show(0);
    start();
  }

  function initFilters() {
    var scope = qs("[data-filter-scope]");
    if (!scope) {
      return;
    }

    var keywordInput = qs("[data-filter-keyword]");
    var regionSelect = qs("[data-filter-region]");
    var typeSelect = qs("[data-filter-type]");
    var yearSelect = qs("[data-filter-year]");
    var countNode = qs("[data-filter-count]");
    var cards = qsa("[data-search-card]");
    var noResults = qs("[data-no-results]");

    var query = new URLSearchParams(window.location.search).get("q");
    if (query && keywordInput) {
      keywordInput.value = query;
    }

    function cardText(card) {
      return normalize([
        card.getAttribute("data-title"),
        card.getAttribute("data-region"),
        card.getAttribute("data-type"),
        card.getAttribute("data-year"),
        card.getAttribute("data-tags"),
        card.getAttribute("data-category")
      ].join(" "));
    }

    function applyFilters() {
      var keyword = normalize(keywordInput && keywordInput.value);
      var region = normalize(regionSelect && regionSelect.value);
      var type = normalize(typeSelect && typeSelect.value);
      var year = normalize(yearSelect && yearSelect.value);
      var visible = 0;

      cards.forEach(function (card) {
        var text = cardText(card);
        var ok = true;
        if (keyword && text.indexOf(keyword) === -1) {
          ok = false;
        }
        if (region && normalize(card.getAttribute("data-region")) !== region) {
          ok = false;
        }
        if (type && normalize(card.getAttribute("data-type")) !== type) {
          ok = false;
        }
        if (year && normalize(card.getAttribute("data-year")) !== year) {
          ok = false;
        }
        card.style.display = ok ? "" : "none";
        if (ok) {
          visible += 1;
        }
      });

      if (countNode) {
        countNode.textContent = String(visible);
      }
      if (noResults) {
        noResults.classList.toggle("is-visible", visible === 0);
      }
    }

    [keywordInput, regionSelect, typeSelect, yearSelect].forEach(function (control) {
      if (!control) {
        return;
      }
      control.addEventListener("input", applyFilters);
      control.addEventListener("change", applyFilters);
    });

    applyFilters();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileMenu();
    initHeroCarousel();
    initFilters();
  });
})();
