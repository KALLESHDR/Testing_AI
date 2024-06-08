// scripts.js

var synth = window.speechSynthesis;
var utterance = null;
var audioElement = document.getElementById('backgroundAudio');

// Function to play background music
function playBackgroundMusic() {
    audioElement.play(); // Start playing background music
}

// Function to stop background music
function stopBackgroundMusic() {
    audioElement.pause(); // Stop background music
}

// Event listener to restart background music when it ends (infinite loop)
audioElement.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play(); // Restart background music when it ends
}, false);

document.getElementById('pdfInput').addEventListener('change', function(event) {
    var file = event.target.files[0];

    if (file && file.type === 'application/pdf') {
        var fileReader = new FileReader();
        fileReader.onload = function() {
            var pdfData = new Uint8Array(this.result);
            pdfjsLib.getDocument(pdfData).promise.then(function(pdf) {
                var textContent = '';

                var pagePromises = [];
                for (var i = 1; i <= pdf.numPages; i++) {
                    pagePromises.push(pdf.getPage(i).then(function(page) {
                        return page.getTextContent().then(function(content) {
                            var pageText = content.items.map(function(item) {
                                return item.str;
                            }).join(' ');
                            return pageText;
                        });
                    }));
                }

                Promise.all(pagePromises).then(function(pagesText) {
                    textContent = pagesText.join('\n');
                    var pdfTextElement = document.getElementById('pdfText');
                    pdfTextElement.innerHTML = highlightKeywords(textContent);
                    document.getElementById('readTextButton').disabled = false;
                    document.getElementById('stopTextButton').disabled = true;
                });
            });
        };

        fileReader.readAsArrayBuffer(file);
    }
});

document.getElementById('readTextButton').addEventListener('click', function() {
    playBackgroundMusic(); // Start playing background music

    var pdfTextElement = document.getElementById('pdfText').innerText;
    var speedControl = document.getElementById('speedControl').value;

    utterance = new SpeechSynthesisUtterance(pdfTextElement);
    utterance.rate = parseFloat(speedControl);

    var selectedVoice = document.getElementById('voiceSelect').value;
    var voices = synth.getVoices();
    var voice = voices.find(v => v.name === selectedVoice);
    if (voice) {
        utterance.voice = voice;
    }

    utterance.onboundary = function(event) {
        const charIndex = event.charIndex;
        highlightSpokenText(charIndex);
        playSoundForKeyword(charIndex);
    };

    synth.speak(utterance);
    document.getElementById('stopTextButton').disabled = false;
    document.getElementById('continueButton').disabled = false;
});

document.getElementById('stopTextButton').addEventListener('click', function() {
    if (utterance) {
        synth.cancel();
        stopBackgroundMusic(); // Stop background music
        document.getElementById('stopTextButton').disabled = true;
    }
});

// Function to highlight spoken text
function highlightSpokenText(charIndex) {
    const pdfTextElement = document.getElementById('pdfText');
    const originalText = pdfTextElement.innerText;
    const highlightedText = highlightKeywords(originalText);

    pdfTextElement.innerHTML = highlightedText;

    const spans = pdfTextElement.getElementsByTagName('span');
    let currentIndex = 0;

    for (let i = 0; i < spans.length; i++) {
        const span = spans[i];
        const text = span.textContent;
        currentIndex += text.length;

        if (currentIndex >= charIndex) {
            span.classList.add('highlight-spoken');
            break;
        }
    }
}

// Function to play sound for keywords
function playSoundForKeyword(charIndex) {
    const pdfTextElement = document.getElementById('pdfText');
    const textContent = pdfTextElement.innerText;
    const words = textContent.split(' ');
    let currentIndex = 0;

    for (let i = 0; i < words.length; i++) {
        currentIndex += words[i].length + 1; // +1 for the space
        if (currentIndex > charIndex) {
            const keyword = words[i].replace(/[.,!?;()]/g, ''); // Remove punctuation
            const audioFile = soundMap[keyword.toLowerCase()];
            if (audioFile) {
                const audio = new Audio(audioFile);
                audio.play();
            }
            break;
        }
    }
}

// Populate voice options
function populateVoices() {
    var voices = synth.getVoices();
    var voiceSelect = document.getElementById('voiceSelect');
    voiceSelect.innerHTML = ''; // Clear previous options

    voices.forEach(function(voice) {
        var option = document.createElement('option');
        option.textContent = `${voice.name} (${voice.lang})`;
        option.value = voice.name;
        voiceSelect.appendChild(option);
    });
}

// Ensure voices are loaded
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = populateVoices;
} else {
    populateVoices(); // For older browser versions
}

// Predefined keywords
const technologyKeywords = ["technology", "computer", "software", "hardware", "internet", "AI", "artificial intelligence"];
const natureKeywords = ["nature", "forest", "river", "mountain", "wildlife", "environment", "ecosystem"];

// Combine all keywords
const keywords = [...technologyKeywords, ...natureKeywords];

// Function to highlight keywords
// Function to highlight keywords
function highlightKeywords(text) {
    let highlightedText = text;
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'gi'); // Use word boundaries
        highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
    });
    return highlightedText;
}