import { H as Hls } from './hls-dru42stk.js';

const video = document.querySelector('video[data-m3u8]');
const overlay = document.querySelector('[data-play-overlay]');
let hls = null;

function initializePlayer() {
    if (!video) {
        return;
    }

    const source = video.getAttribute('data-m3u8');
    if (!source) {
        return;
    }

    if (Hls.isSupported()) {
        hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, function (_event, data) {
            if (!data.fatal) {
                return;
            }
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
            } else {
                hls.destroy();
            }
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
    }
}

initializePlayer();

if (overlay && video) {
    overlay.addEventListener('click', async function () {
        overlay.classList.add('is-hidden');
        try {
            await video.play();
        } catch (error) {
            overlay.classList.remove('is-hidden');
        }
    });

    video.addEventListener('play', function () {
        overlay.classList.add('is-hidden');
    });

    video.addEventListener('pause', function () {
        if (video.currentTime === 0 || video.ended) {
            overlay.classList.remove('is-hidden');
        }
    });
}

window.addEventListener('pagehide', function () {
    if (hls) {
        hls.destroy();
        hls = null;
    }
});
