(function () {
  function qs(name) {
    return new URLSearchParams(window.location.search).get(name) || "";
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function card(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");

    return "<article class=\"movie-card\">" +
      "<a href=\"./" + escapeHtml(movie.file) + "\" class=\"movie-card-link\">" +
      "<figure class=\"movie-poster\">" +
      "<img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + " 在线观看\" loading=\"lazy\">" +
      "<figcaption>" + escapeHtml(movie.score) + "</figcaption>" +
      "</figure>" +
      "<div class=\"movie-card-body\">" +
      "<div class=\"movie-meta-line\"><span>" + escapeHtml(movie.year) + "</span><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.type) + "</span></div>" +
      "<h2>" + escapeHtml(movie.title) + "</h2>" +
      "<p>" + escapeHtml(movie.description) + "</p>" +
      "<div class=\"tag-row\">" + tags + "</div>" +
      "</div>" +
      "</a>" +
      "</article>";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.querySelector(".search-page-form");
    var input = form ? form.querySelector("input[name='q']") : null;
    var summary = document.getElementById("search-summary");
    var results = document.getElementById("search-results");
    var query = qs("q").trim();

    if (input) {
      input.value = query;
    }

    if (!results || !summary) {
      return;
    }

    if (!query) {
      results.innerHTML = "";
      return;
    }

    var lower = query.toLowerCase();
    var matched = (window.SEARCH_INDEX || []).filter(function (movie) {
      return [movie.title, movie.region, movie.year, movie.genre, movie.type, (movie.tags || []).join(" "), movie.description].join(" ").toLowerCase().indexOf(lower) !== -1;
    }).slice(0, 96);

    summary.textContent = matched.length ? "搜索结果：" + query : "没有找到匹配影片：" + query;
    results.innerHTML = matched.map(card).join("");
  });
})();
