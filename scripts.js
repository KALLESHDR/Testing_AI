var synth = window.speechSynthesis;
var utterance = null;

const soundMap = {
    'technology': 'beats.mp3', // Replace with actual filename of technology audio file
    'nature': 'morning_vibes.mp3' // Replace with actual filename of nature audio file
        // Add more keywords and corresponding audio filenames as needed
};

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
                    pdfTextElement.innerHTML = highlightKeywords(textContent); // Use innerHTML for highlighting

                    document.getElementById('readTextButton').disabled = false; // Enable read button
                    document.getElementById('stopTextButton').disabled = true; // Initially disable stop button
                });
            });
        };

        fileReader.readAsArrayBuffer(file);
    }
});

document.getElementById('readTextButton').addEventListener('click', function() {
    var pdfTextElement = document.getElementById('pdfText').innerText; // Use innerText to get text without HTML tags
    var speedControl = document.getElementById('speedControl').value;

    utterance = new SpeechSynthesisUtterance(pdfTextElement);
    utterance.rate = parseFloat(speedControl); // Set reading speed

    // Set voice based on selection
    var selectedVoice = document.getElementById('voiceSelect').value;
    var voices = synth.getVoices();
    var voice = voices.find(v => v.name === selectedVoice);
    if (voice) {
        utterance.voice = voice;
    }

    // Add boundary event to highlight spoken text and play sound for keywords
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
        document.getElementById('stopTextButton').disabled = true;
    }
});

document.getElementById('continueButton').addEventListener('click', function() {
    if (synth.paused) {
        synth.resume();
    } else {
        console.error('Speech synthesis is not paused.');
    }
});

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

function highlightKeywords(text) {
    let highlightedText = text;
    keywords.forEach(keyword => {
        const regex = new RegExp(`(${keyword})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
    });
    console.log('Highlighted Text:', highlightedText); // Debugging log
    return highlightedText;
}

function highlightSpokenText(charIndex) {
    const pdfTextElement = document.getElementById('pdfText');
    const textContent = pdfTextElement.innerText;
    const highlightedText = highlightKeywords(textContent);

    const words = highlightedText.split(' ');
    let currentIndex = 0;

    for (let i = 0; i < words.length; i++) {
        currentIndex += words[i].length + 1; // +1 for the space
        if (currentIndex > charIndex) {
            words[i] = `<span class="highlight">${words[i]}</span>`;
            break;
        }
    }

    pdfTextElement.innerHTML = words.join(' ');
}

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