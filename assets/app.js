(function () {
    const menuButton = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-menu]');

    if (menuButton && menu) {
        menuButton.addEventListener('click', function () {
            menu.classList.toggle('is-open');
        });
    }

    const hero = document.querySelector('[data-hero]');
    if (hero) {
        const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
        const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
        let current = 0;
        let timer = null;

        function setSlide(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === current);
            });
            dots.forEach(function (dot) {
                const dotIndex = Number(dot.getAttribute('data-hero-dot'));
                dot.classList.toggle('active', dotIndex === current);
            });
        }

        function startAutoPlay() {
            stopAutoPlay();
            timer = window.setInterval(function () {
                setSlide(current + 1);
            }, 5200);
        }

        function stopAutoPlay() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                setSlide(Number(dot.getAttribute('data-hero-dot')));
                startAutoPlay();
            });
        });

        hero.addEventListener('mouseenter', stopAutoPlay);
        hero.addEventListener('mouseleave', startAutoPlay);
        startAutoPlay();
    }

    document.querySelectorAll('[data-filter-form]').forEach(function (form) {
        const section = form.closest('section');
        const scope = section ? section.parentElement : document;
        const list = document.querySelector('[data-filter-list]');
        const countNode = document.querySelector('[data-result-count]');
        if (!list) {
            return;
        }

        const items = Array.from(list.children);
        const keywordInput = form.querySelector('[data-filter-keyword]');
        const categorySelect = form.querySelector('[data-filter-category]');
        const yearSelect = form.querySelector('[data-filter-year]');
        const sortSelect = form.querySelector('[data-filter-sort]');
        const query = new URLSearchParams(window.location.search);

        if (keywordInput && !keywordInput.value && query.get('q')) {
            keywordInput.value = query.get('q');
        }

        function text(value) {
            return String(value || '').toLowerCase().trim();
        }

        function applyFilter() {
            const keyword = text(keywordInput && keywordInput.value);
            const category = categorySelect ? categorySelect.value : '';
            const year = yearSelect ? yearSelect.value : '';
            let visible = 0;

            items.forEach(function (item) {
                const search = text(item.getAttribute('data-search'));
                const itemCategory = item.getAttribute('data-category') || '';
                const itemYear = item.getAttribute('data-year') || '';
                const matchKeyword = !keyword || search.includes(keyword);
                const matchCategory = !category || itemCategory === category;
                const matchYear = !year || itemYear === year;
                const show = matchKeyword && matchCategory && matchYear;
                item.classList.toggle('is-hidden-by-filter', !show);
                if (show) {
                    visible += 1;
                }
            });

            if (countNode) {
                countNode.textContent = String(visible);
            }
        }

        function sortItems() {
            const sort = sortSelect ? sortSelect.value : 'default';
            const sorted = items.slice();
            if (sort === 'heat') {
                sorted.sort(function (a, b) {
                    return Number(b.getAttribute('data-heat') || 0) - Number(a.getAttribute('data-heat') || 0);
                });
            } else if (sort === 'year') {
                sorted.sort(function (a, b) {
                    return Number(b.getAttribute('data-year') || 0) - Number(a.getAttribute('data-year') || 0);
                });
            } else if (sort === 'title') {
                sorted.sort(function (a, b) {
                    return String(a.getAttribute('data-title') || '').localeCompare(String(b.getAttribute('data-title') || ''), 'zh-Hans-CN');
                });
            } else {
                sorted.sort(function (a, b) {
                    return items.indexOf(a) - items.indexOf(b);
                });
            }
            sorted.forEach(function (item) {
                list.appendChild(item);
            });
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            if (keywordInput) {
                const value = keywordInput.value.trim();
                const nextUrl = value ? '?q=' + encodeURIComponent(value) : window.location.pathname;
                window.history.replaceState(null, '', nextUrl);
            }
            sortItems();
            applyFilter();
        });
        form.addEventListener('input', applyFilter);
        form.addEventListener('change', function () {
            sortItems();
            applyFilter();
        });
        form.addEventListener('reset', function () {
            window.setTimeout(function () {
                sortItems();
                applyFilter();
            }, 0);
        });
        applyFilter();
    });

    document.querySelectorAll('[data-favorite]').forEach(function (button) {
        const id = button.getAttribute('data-favorite');
        const key = 'movie_favorites';
        const saved = JSON.parse(localStorage.getItem(key) || '[]');
        if (saved.includes(id)) {
            button.textContent = '已收藏';
        }
        button.addEventListener('click', function () {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            const index = list.indexOf(id);
            if (index >= 0) {
                list.splice(index, 1);
                button.textContent = '收藏';
            } else {
                list.push(id);
                button.textContent = '已收藏';
            }
            localStorage.setItem(key, JSON.stringify(list));
        });
    });

    document.querySelectorAll('[data-share]').forEach(function (button) {
        button.addEventListener('click', async function () {
            const payload = {
                title: document.title,
                url: window.location.href
            };
            if (navigator.share) {
                try {
                    await navigator.share(payload);
                    return;
                } catch (error) {
                    // 用户取消分享时保持静默。
                }
            }
            try {
                await navigator.clipboard.writeText(window.location.href);
                button.textContent = '链接已复制';
                window.setTimeout(function () {
                    button.textContent = '分享';
                }, 1800);
            } catch (error) {
                button.textContent = '复制失败';
            }
        });
    });
})();
