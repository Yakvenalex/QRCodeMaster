document.addEventListener('DOMContentLoaded', init);

function init() {
    const form = document.getElementById('qrForm');
    const qrSizeInput = document.getElementById('qrSize');
    const qrSizeValue = document.getElementById('qrSizeValue');
    const logoInput = document.getElementById('logo');
    const logoInfo = document.getElementById('logoInfo');
    const dotScaleInput = document.getElementById('dotScale');
    const dotScaleValue = document.getElementById('dotScaleValue');
    const backgroundImageAlphaInput = document.getElementById('backgroundImageAlpha');
    const backgroundImageAlphaValue = document.getElementById('backgroundImageAlphaValue');

    setupInputListeners({
        qrSizeInput,
        qrSizeValue,
        dotScaleInput,
        dotScaleValue,
        backgroundImageAlphaInput,
        backgroundImageAlphaValue,
        logoInput,
        logoInfo
    });
    setupFormSubmit(form);
}

function setupInputListeners({
                                 qrSizeInput,
                                 qrSizeValue,
                                 dotScaleInput,
                                 dotScaleValue,
                                 backgroundImageAlphaInput,
                                 backgroundImageAlphaValue,
                                 logoInput,
                                 logoInfo
                             }) {
    qrSizeInput.addEventListener('input', () => updateTextContent(qrSizeValue, `${qrSizeInput.value}px`));
    dotScaleInput.addEventListener('input', () => updateTextContent(dotScaleValue, dotScaleInput.value));
    backgroundImageAlphaInput.addEventListener('input', () => updateTextContent(backgroundImageAlphaValue, backgroundImageAlphaInput.value));

    logoInput.addEventListener('change', handleLogoSelection.bind(null, logoInfo));
}

function setupFormSubmit(form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateForm()) {
            generateQR();
        }
    });
}

function updateTextContent(element, text) {
    element.textContent = text;
}

function handleLogoSelection(logoInfo, event) {
    const file = event.target.files[0];
    logoInfo.innerHTML = file ? `Выбран файл: ${file.name} (${(file.size / 1024).toFixed(2)} КБ)` : '';
}

function validateForm() {
    const qrInput = document.getElementById('qrInput').value.trim();
    if (!qrInput) {
        showErrorMessage('Пожалуйста, введите текст или URL для QR-кода.');
        return false;
    }
    return true;
}

function showLoader(isVisible) {
    const loader = document.getElementById('loader');
    loader.style.display = isVisible ? 'block' : 'none';
}

async function generateQR() {
    try {
        showLoader(true);
        resetQRCodeState();
        const qrCodeOptions = getQRCodeOptions();
        const logoFile = getFileFromInput('logo');
        const backgroundFile = getFileFromInput('backgroundImage');

        if (logoFile) qrCodeOptions.logo = URL.createObjectURL(logoFile);
        if (backgroundFile) qrCodeOptions.backgroundImage = URL.createObjectURL(backgroundFile);

        const qrcodeContainer = document.getElementById('qrcode');
        clearQRCodeContainer(qrcodeContainer);

        await createQRCode(qrcodeContainer, qrCodeOptions);
        showLoader(false);
    } catch (error) {
        showLoader(false);
        handleError(error);
    }
}

function getQRCodeOptions() {
    const formData = new FormData(document.getElementById('qrForm'));
    return {
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
        onRenderingEnd: updateQRCodeDisplay,
    };
}

function getFileFromInput(inputId) {
    const input = document.getElementById(inputId);
    return input && input.files[0];
}

function clearQRCodeContainer(container) {
    container.innerHTML = '';
}

async function createQRCode(container, options) {
    return new Promise((resolve, reject) => {
        new QRCode(container, {
            ...options,
            onRenderingEnd: function (qrCodeOptions, dataURL) {
                updateQRCodeDisplay(dataURL);
                resolve();
            },
            onError: reject,
        });
    });
}

function updateQRCodeDisplay(dataURL) {
    const qrcodeDiv = document.getElementById('qrcode');
    qrcodeDiv.innerHTML = `
        <div style="text-align: center;">
            <img src="${dataURL}" alt="QR Code" style="display: block; margin: 0 auto;">
            <button id="sendToTelegram" class="telegram-btn" onclick="sendToTelegram()" style="display: block; margin-top: 10px;">Отправить в Telegram</button>
        </div>`;
}

async function sendToTelegram() {
    const img = document.querySelector('#qrcode img');
    if (!img) {
        return showErrorMessage('Пожалуйста, сначала создайте QR-код.');
    }

    if (tg) {
        try {
            await sendQRCodeToTelegram(img.src);
            showSuccessMessage('QR-код успешно отправлен в Telegram.');
        } catch (error) {
            showErrorMessage('Не удалось отправить QR-код. Попробуйте еще раз.');
        }
    } else {
        showErrorMessage('Эта функция доступна только в Telegram WebApp.');
    }
}

async function sendQRCodeToTelegram(qrCodeUrl) {
    const userId = tg.initDataUnsafe.user.id;
    const response = await fetch(`/api/send-qr/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({qr_code_url: qrCodeUrl, user_id: userId}),
    });

    if (!response.ok) {
        throw new Error('Ошибка при отправке QR-кода');
    }

    return response.json();
}

function showErrorMessage(message) {
    if (tg?.showPopup) {
        tg.showPopup({title: 'Ошибка', message, buttons: [{type: 'close'}]});
    } else {
        alert(message);
    }
}

function showSuccessMessage(message) {
    if (tg?.showPopup) {
        tg.showPopup({title: 'Успех', message, buttons: [{type: 'close'}]});
        setTimeout(() => tg.close(), 2000);
    }
}

function handleError(error) {
    const errorMessage = error.message || 'Произошла непредвиденная ошибка';
    showErrorMessage(errorMessage);
}

function resetQRCodeState() {
    document.getElementById('qrcode').innerHTML = '<p>Генерация QR-кода...</p>';
}