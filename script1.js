// script.js

// Variable to track if background music is playing
let bgMusicPlaying = false;
let textToSpeechUtterance = null;

// Function to handle file input change event
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

// Function to analyze text content
function analyzeText() {
    const inputText = document.getElementById('userInput').value;
    const keywordCountElement = document.getElementById('keywordCount');

    // Keywords and corresponding music files
    const keywords = {
        'sun is rising': 'morning_vibes.mp3',
        'night time': 'beats.mp3',
        'nature': 'morning_vibes.mp3',
        'environment': 'beats.mp3',
        'ecosystem': 'morning_vibes.mp3',
        'wildlife': 'beats.mp3',
        'conservation': 'morning_vibes.mp3',
        // Add more keywords and corresponding music files as needed
    };

    let keywordCount = 0;
    let musicFile = 'beats.mp3';

    // Check for keywords in input text
    for (const [keyword, file] of Object.entries(keywords)) {
        if (inputText.toLowerCase().includes(keyword)) {
            keywordCount++;
            musicFile = file;
        }
    }

    // Display keyword count
    keywordCountElement.innerText = `Number of identified keywords: ${keywordCount}`;

    // Change the music if a keyword is identified
    if (musicFile !== 'beats.mp3') {
        playMusic(musicFile);
    } else {
        // Stop music if no keyword is identified
        stopMusic();
    }

    // Stop any ongoing text-to-speech reading
    stopReading();

    // Text-to-Speech
    if ('speechSynthesis' in window) {
        textToSpeechUtterance = new SpeechSynthesisUtterance(inputText);
        textToSpeechUtterance.onstart = () => {
            bgMusicPlaying = true; // Mark background music as playing during speech
            const bgMusic = document.getElementById('bgMusic');
            bgMusic.volume = 0.2; // Lower background music volume during speech
        };
        textToSpeechUtterance.onend = () => {
            bgMusicPlaying = false; // Mark background music as not playing after speech
            const bgMusic = document.getElementById('bgMusic');
            bgMusic.volume = 1; // Restore background music volume after speech
        };
        window.speechSynthesis.speak(textToSpeechUtterance);
    } else {
        alert("Sorry, your browser doesn't support text-to-speech.");
    }
}

// Function to play music
function playMusic(file) {
    const audioSource = document.getElementById('audioSource');
    const bgMusic = document.getElementById('bgMusic');

    if (!audioSource.src.includes(file)) {
        // Change the source and play new music
        audioSource.src = file;
        bgMusic.load();
    }
    bgMusic.play();
}

// Function to pause music
function pauseMusic() {
    const bgMusic = document.getElementById('bgMusic');
    bgMusic.pause();
}

// Function to continue music
function continueMusic() {
    if (bgMusicPlaying) { // Check if background music was playing before pausing
        const bgMusic = document.getElementById('bgMusic');
        bgMusic.play();
    }
}

// Function to stop music
function stopMusic() {
    const bgMusic = document.getElementById('bgMusic');
    bgMusic.pause();
    bgMusic.currentTime = 0;
    bgMusicPlaying = false; // Mark background music as not playing
}

// Function to stop reading
function stopReading() {
    if ('speechSynthesis' in window && textToSpeechUtterance !== null) {
        window.speechSynthesis.cancel();
        textToSpeechUtterance = null;
    }
}