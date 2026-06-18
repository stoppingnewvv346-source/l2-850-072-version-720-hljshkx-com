(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function initHeader() {
        var header = document.querySelector('[data-header]');
        var toggle = document.querySelector('[data-nav-toggle]');
        var nav = document.querySelector('[data-site-nav]');

        function syncHeader() {
            if (!header) {
                return;
            }
            header.classList.toggle('scrolled', window.scrollY > 12);
        }

        syncHeader();
        window.addEventListener('scroll', syncHeader, { passive: true });

        if (toggle && nav) {
            toggle.addEventListener('click', function () {
                nav.classList.toggle('open');
                document.body.classList.toggle('nav-open', nav.classList.contains('open'));
            });
        }
    }

    function initHero() {
        var hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var prev = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === index);
            });
        }

        function restart() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(index + 1);
            }, 6200);
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.dataset.heroDot || 0));
                restart();
            });
        });

        if (prev) {
            prev.addEventListener('click', function () {
                show(index - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(index + 1);
                restart();
            });
        }

        show(0);
        restart();
    }

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function initFilters() {
        var areas = Array.prototype.slice.call(document.querySelectorAll('[data-filter-area]'));
        areas.forEach(function (area) {
            var input = area.querySelector('[data-search-input]');
            var buttons = Array.prototype.slice.call(area.querySelectorAll('[data-filter-button]'));
            var cards = Array.prototype.slice.call(area.querySelectorAll('.movie-card'));
            var empty = area.querySelector('[data-empty-state]');
            var activeFilter = 'all';

            function apply() {
                var query = normalize(input ? input.value : '');
                var visible = 0;
                cards.forEach(function (card) {
                    var haystack = normalize([
                        card.dataset.title,
                        card.dataset.region,
                        card.dataset.type,
                        card.dataset.year,
                        card.dataset.genre,
                        card.dataset.tags
                    ].join(' '));
                    var typeMatch = activeFilter === 'all' || haystack.indexOf(normalize(activeFilter)) !== -1;
                    var queryMatch = !query || haystack.indexOf(query) !== -1;
                    var match = typeMatch && queryMatch;
                    card.style.display = match ? '' : 'none';
                    if (match) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle('show', visible === 0);
                }
            }

            if (input) {
                input.addEventListener('input', apply);
            }

            buttons.forEach(function (button) {
                button.addEventListener('click', function () {
                    activeFilter = button.dataset.filterButton || 'all';
                    buttons.forEach(function (item) {
                        item.classList.toggle('active', item === button);
                    });
                    apply();
                });
            });

            var params = new URLSearchParams(window.location.search);
            var initialQuery = params.get('q') || params.get('year') || '';
            if (input && initialQuery) {
                input.value = initialQuery;
            }
            apply();
        });
    }

    function initPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
        players.forEach(function (player) {
            var video = player.querySelector('video');
            var button = player.querySelector('[data-play-button]');
            var status = player.querySelector('[data-player-status]');
            var mediaUrl = player.dataset.source;
            var hlsInstance = null;
            var started = false;

            function setStatus(message, visible) {
                if (!status) {
                    return;
                }
                status.textContent = message || '';
                status.classList.toggle('show', Boolean(visible && message));
            }

            function start() {
                if (!video || !mediaUrl) {
                    setStatus('播放源暂不可用', true);
                    return;
                }
                if (started) {
                    video.play().catch(function () {});
                    return;
                }
                started = true;
                setStatus('正在加载影片', true);

                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hlsInstance.loadSource(mediaUrl);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        setStatus('', false);
                        if (button) {
                            button.classList.add('is-hidden');
                        }
                        video.play().catch(function () {
                            setStatus('点击画面继续播放', true);
                        });
                    });
                    hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                        if (!data || !data.fatal) {
                            return;
                        }
                        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                            setStatus('网络连接异常，正在重试', true);
                            hlsInstance.startLoad();
                        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                            setStatus('媒体加载异常，正在恢复', true);
                            hlsInstance.recoverMediaError();
                        } else {
                            setStatus('暂时无法播放，请稍后再试', true);
                        }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = mediaUrl;
                    video.addEventListener('loadedmetadata', function () {
                        setStatus('', false);
                        if (button) {
                            button.classList.add('is-hidden');
                        }
                        video.play().catch(function () {
                            setStatus('点击画面继续播放', true);
                        });
                    }, { once: true });
                } else {
                    setStatus('浏览器暂不支持该播放源', true);
                }
            }

            if (button) {
                button.addEventListener('click', start);
            }

            if (video) {
                video.addEventListener('play', function () {
                    if (button) {
                        button.classList.add('is-hidden');
                    }
                });
                video.addEventListener('error', function () {
                    setStatus('暂时无法播放，请稍后再试', true);
                });
            }

            window.addEventListener('pagehide', function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                    hlsInstance = null;
                }
            });
        });
    }

    ready(function () {
        initHeader();
        initHero();
        initFilters();
        initPlayers();
    });
})();
