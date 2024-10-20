document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('qrForm');
    const qrSizeInput = document.getElementById('qrSize');
    const qrSizeValue = document.getElementById('qrSizeValue');
    const logoInput = document.getElementById('logo');
    const logoInfo = document.getElementById('logoInfo');
    const dotScaleInput = document.getElementById('dotScale');
    const dotScaleValue = document.getElementById('dotScaleValue');
    const backgroundImageAlphaInput = document.getElementById('backgroundImageAlpha');
    const backgroundImageAlphaValue = document.getElementById('backgroundImageAlphaValue');

    // Обновление отображаемых значений
    qrSizeInput.addEventListener('input', function () {
        qrSizeValue.textContent = this.value + 'px';
    });

    dotScaleInput.addEventListener('input', function () {
        dotScaleValue.textContent = this.value;
    });

    backgroundImageAlphaInput.addEventListener('input', function () {
        backgroundImageAlphaValue.textContent = this.value;
    });

    // Обработчик события изменения файла логотипа
    logoInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const fileSize = (file.size / 1024).toFixed(2); // Размер в КБ
            const fileName = file.name;
            logoInfo.innerHTML = `Выбран файл: ${fileName} (${fileSize} КБ)`;
        } else {
            logoInfo.innerHTML = '';
        }
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (validateInput()) {
            generateQR();
        }
    });
});

function validateInput() {
    const qrInput = document.getElementById('qrInput');
    if (!qrInput.value.trim()) {
        alert('Пожалуйста, введите текст или URL для QR-кода.');
        return false;
    }
    return true;
}

function resetQRCodeState() {
    const qrcodeDiv = document.getElementById('qrcode');
    qrcodeDiv.innerHTML = '<p>Генерация QR-кода...</p>';
}

async function generateQR() {
    resetQRCodeState();

    try {
        if (typeof tg === 'undefined' || !tg.initDataUnsafe?.user?.id) {
            throw new Error("Telegram WebApp не инициализирован корректно");
        }

        const form = document.getElementById('qrForm');
        if (!form) throw new Error("Форма QR не найдена");

        const formData = new FormData(form);
        const options = {
            text: formData.get('text'),
            width: parseInt(formData.get('width')),
            height: parseInt(formData.get('width')),
            colorDark: formData.get('colorDark'),
            colorLight: formData.get('colorLight'),
            correctLevel: QRCode.CorrectLevel[formData.get('correctLevel')],
            dotScale: parseFloat(formData.get('dotScale')),
            quietZone: parseInt(formData.get('quietZone')),
            logoWidth: parseInt(formData.get('logoWidth')),
            logoHeight: parseInt(formData.get('logoHeight')),
            backgroundImageAlpha: parseFloat(formData.get('backgroundImageAlpha')),
            onRenderingEnd: function (qrCodeOptions, dataURL) {
                updateQRCodeDisplay(dataURL);
            }
        };

        const logoFile = document.getElementById('logo').files[0];
        if (logoFile) {
            options.logo = URL.createObjectURL(logoFile);
        }

        const backgroundFile = document.getElementById('backgroundImage').files[0];
        if (backgroundFile) {
            options.backgroundImage = URL.createObjectURL(backgroundFile);
        }

        const qrcodeContainer = document.getElementById('qrcode');
        qrcodeContainer.innerHTML = '';
        new QRCode(qrcodeContainer, options);

    } catch (error) {
        handleError(error);
    }
}

function handleError(error) {
    console.error('Детали ошибки:', error);

    let errorMessage = 'Произошла непредвиденная ошибка';
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    if (typeof tg !== 'undefined' && tg.showPopup) {
        tg.showPopup({
            title: 'Ошибка',
            message: errorMessage,
            buttons: [
                {type: 'close'},
                {type: 'default', text: 'Сбросить', id: 'reset'}
            ]
        }).then((buttonId) => {
            if (buttonId === 'reset') {
                document.getElementById('qrForm')?.reset();
                resetQRCodeState();
            }
        });
    } else {
        alert(`Ошибка: ${errorMessage}`);
    }
}

function updateQRCodeDisplay(dataURL) {
    const qrcodeDiv = document.getElementById('qrcode');

    qrcodeDiv.innerHTML = `
        <div style="text-align: center;">
            <img src="${dataURL}" alt="QR Code" style="display: block; margin: 0 auto;">
            <button id="sendToTelegram" class="telegram-btn" onclick="sendToTelegram()" style="display: block; margin-top: 10px;">Отправить в Telegram</button>
        </div>
    `;
}

async function sendToTelegram() {
    const img = document.querySelector('#qrcode img');
    if (!img) {
        alert('Пожалуйста, сначала создайте QR-код.');
        return;
    }

    if (tg) {
        const userId = tg.initDataUnsafe.user.id;
        const qrCodeUrl = img.src;
        try {
            const response = await fetch(`/api/send-qr/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    qr_code_url: qrCodeUrl,
                    user_id: userId
                }),
            });

            if (!response.ok) {
                throw new Error('Ошибка при отправке QR-кода');
            }

            const result = await response.json();
            console.log('QR-код успешно отправлен:', result);

            tg.showPopup({
                title: 'Успех',
                message: 'QR-код успешно отправлен в Telegram.',
                buttons: [{type: 'close'}]
            });

            setTimeout(() => {
                tg.close();
            }, 2000);
        } catch (error) {
            console.error('Ошибка:', error);
            tg.showPopup({
                title: 'Ошибка',
                message: 'Не удалось отправить QR-код. Попробуйте еще раз.',
                buttons: [{type: 'close'}]
            });
        }
    } else {
        alert('Эта функция доступна только в Telegram WebApp.');
    }
}