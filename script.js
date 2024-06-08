document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        const fileReader = new FileReader();
        fileReader.onload = function() {
            const typedArray = new Uint8Array(this.result);
            pdfjsLib.getDocument(typedArray).promise.then(function(pdf) {
                let pdfText = '';
                const totalPages = pdf.numPages;
                let countPromises = [];

                for (let i = 1; i <= totalPages; i++) {
                    countPromises.push(pdf.getPage(i).then(function(page) {
                        return page.getTextContent().then(function(textContent) {
                            textContent.items.forEach(function(textItem) {
                                pdfText += textItem.str + ' ';
                            });
                        });
                    }));
                }

                Promise.all(countPromises).then(function() {
                    document.getElementById('userInput').value = pdfText;
                });
            });
        };
        fileReader.readAsArrayBuffer(file);
    } else {
        alert('Please upload a valid PDF file.');
    }
});

function analyzeText() {
    const inputText = document.getElementById('userInput').value;
    const keywordCountElement = document.getElementById('keywordCount');

    const keywords = ['sun is rising', 'night time'];
    const musicFiles = {
        'sun is rising': 'morning_vibes.mp3',
        'night time': 'beats.mp3'
    };

    let keywordCount = 0;
    let musicFile = 'beats.mp3';

    keywords.forEach(keyword => {
        if (inputText.toLowerCase().includes(keyword)) {
            keywordCount++;
            musicFile = musicFiles[keyword];
        }
    });

    keywordCountElement.innerText = `Number of identified keywords: ${keywordCount}`;

    // Always start with default music
    playMusic('beats.mp3');

    // Change the music if a keyword is identified
    if (musicFile !== 'beats.mp3') {
        setTimeout(() => playMusic(musicFile), 1000); // Delay to ensure default music starts first
    }

    // Text-to-Speech
    if ('speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(inputText);
        speech.onstart = () => {
            bgMusic.volume = 0.5; // Lower background music volume during speech
        };
        speech.onend = () => {
            bgMusic.volume = 1; // Restore background music volume after speech
        };
        window.speechSynthesis.speak(speech);
    } else {
        alert("Sorry, your browser doesn't support text-to-speech.");
    }
}

function playMusic(file) {
    const audioSource = document.getElementById('audioSource');
    const bgMusic = document.getElementById('bgMusic');

    if (audioSource.src.includes(file)) {
        // Continue playing the current music if it matches the required file
        bgMusic.play();
    } else {
        // Change the source and play new music
        audioSource.src = file;
        bgMusic.load();
        bgMusic.play();
    }
}