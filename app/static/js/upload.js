let scanResult = '';

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const image = new Image();
            image.onload = function () {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = image.width;
                canvas.height = image.height;
                context.drawImage(image, 0, 0, image.width, image.height);

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, canvas.width, canvas.height);

                if (code) {
                    scanResult = code.data;
                    document.getElementById('scanResult').textContent = `QR Code Content: ${scanResult}`;
                    document.getElementById('resultSection').style.display = 'block';
                } else {
                    showPopup('No QR code found in the image.');
                }
            };
            image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
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
    const tg = window.Telegram.WebApp;
    tg.showPopup({
        title: 'Информация',
        message: message,
        buttons: [{type: 'close'}]
    });
}

document.getElementById('fileInput').addEventListener('change', handleFileUpload);