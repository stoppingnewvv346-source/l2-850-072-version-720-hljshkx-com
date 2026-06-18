(function () {
  "use strict";

  var hlsConstructorPromise = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function loadLocalHlsModule() {
    return import("./hls-dru42stk.js").then(function (module) {
      return module.H || module.default;
    });
  }

  function getHlsConstructor() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }
    if (!hlsConstructorPromise) {
      hlsConstructorPromise = loadLocalHlsModule().catch(function () {
        return loadScript("https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js").then(function () {
          return window.Hls;
        });
      });
    }
    return hlsConstructorPromise;
  }

  function updateStatus(video, message) {
    var shell = video.closest(".video-shell");
    var status = shell && shell.querySelector("[data-player-status]");
    if (status) {
      status.textContent = message;
    }
  }

  function bindOverlay(video) {
    var shell = video.closest(".video-shell");
    var button = shell && shell.querySelector("[data-play-target]");
    if (!shell || !button) {
      return;
    }

    button.addEventListener("click", function () {
      video.play().catch(function () {
        updateStatus(video, "请再次点击播放器开始播放");
      });
    });

    video.addEventListener("play", function () {
      shell.classList.add("is-playing");
      updateStatus(video, "正在播放 HLS 视频源");
    });

    video.addEventListener("pause", function () {
      shell.classList.remove("is-playing");
    });
  }

  function setupVideo(video) {
    var source = video.getAttribute("data-hls-src");
    if (!source) {
      updateStatus(video, "未找到播放源");
      return;
    }

    bindOverlay(video);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
      updateStatus(video, "已绑定原生 HLS 播放源");
      return;
    }

    getHlsConstructor().then(function (Hls) {
      if (!Hls || !Hls.isSupported || !Hls.isSupported()) {
        updateStatus(video, "当前浏览器不支持 HLS 播放");
        return;
      }

      var hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(source);
      hls.attachMedia(video);
      updateStatus(video, "HLS 播放源已初始化");

      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        updateStatus(video, "播放清单已加载，可点击播放");
      });

      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          updateStatus(video, "播放源加载异常，请刷新或更换浏览器");
          hls.destroy();
        }
      });
    }).catch(function () {
      updateStatus(video, "HLS 播放库加载失败");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var videos = Array.prototype.slice.call(document.querySelectorAll("video[data-hls-src]"));
    videos.forEach(setupVideo);
  });
})();
