document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('qrForm');
    const qrSizeInput = document.getElementById('qrSize');
    const qrSizeValue = document.getElementById('qrSizeValue');
    const qrLogoInput = document.getElementById('qrLogo');
    const logoInfo = document.getElementById('logoInfo');

    // Обновление отображаемого значения размера QR-кода
    qrSizeInput.addEventListener('input', function () {
        qrSizeValue.textContent = this.value + 'px';
    });

    // Обработчик события изменения файла логотипа
    qrLogoInput.addEventListener('change', function (e) {
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchQRCode(userID, formData) {
    let jsonData = {
        user_id: userID,
        qr_input: formData.get('qr_input'),
        qr_size: parseInt(formData.get('qr_size')),
        color_picker: formData.get('color_picker'),
        bg_color_picker: formData.get('bg_color_picker'),
        error_correction_level: formData.get('error_correction_level'),
        qr_logo: null
    };

    const logoFile = formData.get('qr_logo');
    if (logoFile && logoFile.size > 0) {
        console.log('Processing logo file...');
        if (logoFile.size > 10024 * 10024) {
            throw new Error('Logo file is too large. Maximum size is 10MB.');
        }
        try {
            const base64Logo = await convertToBase64(logoFile);
            jsonData.qr_logo = base64Logo;
            console.log('Logo processed successfully');
        } catch (error) {
            console.error('Error processing logo:', error);
            throw new Error('Failed to process logo: ' + error.message);
        }
    }

    console.log('Sending request to server...');
    const response = await fetch(`/api/generate-qr/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (!data.qr_code_url) {
        throw new Error('QR code URL not received from server');
    }

    return data.qr_code_url;
}

function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            console.log('Размер base64 логотипа:', base64.length);
            resolve(base64);
        };
        reader.onerror = error => {
            console.error('Ошибка при чтении файла:', error);
            reject(error);
        };
    });
}

function handleError(error) {
    console.error('Error details:', error);

    let errorMessage = 'An unexpected error occurred';
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    if (typeof tg !== 'undefined' && tg.showPopup) {
        tg.showPopup({
            title: 'Error',
            message: errorMessage,
            buttons: [
                {type: 'close'},
                {type: 'default', text: 'Reset', id: 'reset'}
            ]
        }).then((buttonId) => {
            if (buttonId === 'reset') {
                document.getElementById('qrForm')?.reset();
                resetQRCodeState();
            }
        });
    } else {
        alert(`Error: ${errorMessage}`);
    }
}

async function generateQR() {
    resetQRCodeState(); // Сбрасываем состояние перед генерацией

    const userID = tg.initDataUnsafe.user.id;
    try {
        if (!userID) {
            throw new Error("User ID not available");
        }

        const form = document.getElementById('qrForm');
        if (!form) throw new Error("QR form not found");

        const formData = new FormData(form);

        const qrCodeUrl = await fetchQRCode(userID, formData);
        updateQRCodeDisplay(qrCodeUrl); // Обновляем отображение QR-кода
    } catch (error) {
        handleError(error);
    }
}

function updateQRCodeDisplay(url) {
    const qrcodeDiv = document.getElementById('qrcode');

    // Очищаем предыдущее содержимое и вставляем QR-код и кнопку
    qrcodeDiv.innerHTML = `
        <div style="text-align: center;">
            <img src="${url}" alt="QR Code" style="display: block; margin: 0 auto;">
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

            // Закрываем Mini App после короткой задержки
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