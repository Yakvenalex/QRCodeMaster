let scanning = false;
let videoStream;
let scanResult = '';

function clearScanResults() {
    scanResult = '';
    document.getElementById('scanResult').textContent = '';
    document.getElementById('resultArea').style.display = 'none';
}

async function startScanning() {
    try {
        clearScanResults();
        videoStream = await navigator.mediaDevices.getUserMedia({video: {facingMode: "environment"}});
        const video = document.getElementById('video');
        video.srcObject = videoStream;
        video.setAttribute('playsinline', true);
        video.play();
        requestAnimationFrame(tick);
        scanning = true;
        document.getElementById('toggleScanBtn').textContent = 'Stop Scanning';

        // Показать сканирующую линию
        document.getElementById('scannerLine').style.display = 'block';
    } catch (err) {
        console.error('Error accessing the camera', err);
        alert('Unable to access the camera: ' + err.message);
    }
}

function stopScanning() {
    if (videoStream) {
        const tracks = videoStream.getTracks();
        tracks.forEach(track => track.stop());
        document.getElementById('video').srcObject = null;
        scanning = false;
        document.getElementById('toggleScanBtn').textContent = 'Start Scanning';

        // Скрыть сканирующую линию
        document.getElementById('scannerLine').style.display = 'none';
    }
}

function toggleScanning() {
    if (scanning) {
        stopScanning();
    } else {
        startScanning();
    }
}

function tick() {
    if (!scanning) return;

    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            console.log("Found QR code", code.data);
            scanResult = code.data;
            document.getElementById('scanResult').textContent = "QR Code content: " + scanResult;
            document.getElementById('resultArea').style.display = 'block';
            stopScanning();
        }
    }

    requestAnimationFrame(tick);
}

function copyResult() {
    if (scanResult) {
        navigator.clipboard.writeText(scanResult).then(() => {
            showPopup(`Вы добавили в буфер: ${scanResult}`);
        }, (err) => {
            console.error('Could not copy text: ', err);
            showPopup('Не удалось скопировать текст');
        });
    }
}

async function sendToTelegram() {
    if (scanResult) {
        const userId = tg.initDataUnsafe.user.id;

        try {
            const response = await fetch('/api/send-scaner-info/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    result_scan: scanResult
                }),
            });

            if (!response.ok) {
                throw new Error('Ошибка при отправке данных');
            }

            const result = await response.json();
            showPopup(result.message);
        } catch (error) {
            console.error('Ошибка:', error);
            showPopup('Не удалось отправить данные в Telegram');
        }
    }
}

function showPopup(message) {
    tg.showPopup({
        title: 'Информация',
        message: message,
        buttons: [{type: 'close'}]
    });
}

// Инициализация: скрываем область результатов при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('resultArea').style.display = 'none';
});