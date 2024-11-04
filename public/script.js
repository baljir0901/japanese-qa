const translations = {
    en: {
        nameQuestion: "What is your name?",
        submitButton: "Submit",
        thankYou: "Thank you! Your response has been translated and sent to your email.",
        japaneseTranslation: "Japanese Translation:"
    },
    mn: {
        nameQuestion: "Таны нэр хэн бэ?",
        submitButton: "Илгээх",
        thankYou: "Баярлалаа! Таны хариулт орчуулагдаж имэйл хаяг руу илгээгдлээ.",
        japaneseTranslation: "Япон орчуулга:"
    }
};

let currentLanguage = 'en';

function selectLanguage(lang) {
    currentLanguage = lang;
    document.getElementById('language-selection').style.display = 'none';
    
    const container = document.querySelector('.container');
    const formHtml = `
        <div id="name-form">
            <h2>${translations[lang].nameQuestion}</h2>
            <input type="text" id="user-name">
            <button onclick="submitName('${lang}')">${translations[lang].submitButton}</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', formHtml);
}

async function submitName(lang) {
    const name = document.getElementById('user-name').value;
    if (!name) {
        alert('Please enter your name');
        return;
    }

    try {
        console.log('Submitting name:', name); // Debug log
        const response = await fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: lang,
                name: name,
                email: 'baljir0901@gmail.com'
            })
        });

        console.log('Response received:', response); // Debug log

        const result = await response.json();
        console.log('Result:', result); // Debug log

        if (result.success) {
            document.getElementById('name-form').style.display = 'none';
            
            const resultHtml = `
                <div class="result">
                    <p>${translations[lang].thankYou}</p>
                    <h3>${translations[lang].japaneseTranslation}</h3>
                    <p>Q: ${result.translations.question}</p>
                    <p>A: ${result.translations.answer}</p>
                </div>
            `;
            
            document.querySelector('.container').insertAdjacentHTML('beforeend', resultHtml);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}