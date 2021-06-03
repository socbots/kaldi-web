//import IDBHandler from './workerWrappers/idbHandler.js';
import ASRHandler from './workerWrappers/asrHandler.js';

import ResampleHandler from './workerWrappers/resamplerHandler.js';
import downloadModelFromWeb from './utils/downloadModel.js';

const AudioContext = window.AudioContext || window.webkitAudioContext;

const config = {
    resamplerBufferSize: 4096, // ~ 90 ms at 44.1kHz
    modelURLPrefix: 'models',
    // modelURLPrefix: "https://people.arcada.fi/~penttinj/socbots/kaldi/models/",
};

const state = {
    prevIsFinal: false,
    transcriptions: [""],
    tmpTranscription: "",
    robotCanListen: true,
}


const asrHandler = new ASRHandler();
let resamplerHandler;

navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then((stream) => {
        const context = new AudioContext();
        const audioSource = context.createMediaStreamSource(stream);
        resamplerHandler = new ResampleHandler(audioSource,
            onResampled, config.resamplerBufferSize);
    })
    .catch(console.error);


function onModelChange(modelName) {
    downloadAndStore(modelName)
        .then(({ value: zip }) => new Promise((resolve, reject) => {
            asrHandler.terminate()
                .then(() => {
                    outputEl.innerHTML = "Initializing model";
                    resolve(asrHandler.init(modelName, zip));
                })
                .catch(reject);
        }))
        .then(() => asrHandler.getSampleRate())
        .then((asrSR) => { resamplerHandler.setSampleRate(asrSR); outputEl.innerHTML = "Model is set"; })
        .catch(console.error);
}


function onResampled(buffer) {
    const { robotCanListen } = state;
    if (robotCanListen) {
        asrHandler.process(buffer)
            .then(updateTranscription);
    }
}

function downloadAndStore(modelName) {
    // prefix = models, so it fetches from localhost:8080/models/:modelName which is actually a
    // a proxy to the express server at localhost:3300/models/:modelName
    const { modelURLPrefix } = config;
    return new Promise((resolve, reject) => {
        console.log("Downloading model");
        outputEl.innerHTML = "Downloading model";
        downloadModelFromWeb(`${modelURLPrefix}/${modelName}`)
            .then((zip) => { resolve({ value: zip }); })
            .catch(reject);
    });
}

function updateTranscription(transcription) {
    if (transcription === null) return;
    const { text, isFinal } = transcription;
    // skip streak of isFinal (i.e. repetition of final utterance)
    if (/*!state.prevIsFinal*/true) {
        // bug: first trancript of new utterance always skipped
        // TODO: ^ Maybe because of setting prevIsFinal? These darn frog eaters...... We'll test that some time.
        if (isFinal && text !== '') {
            const { transcriptions } = state;
            state.transcriptions.push(text)
            state.tmpTranscription = '';
            console.log("The transcription was final and it was said: ", text);
            outputEl.innerHTML = state.transcriptions;
        } else {
            state.tmpTranscription = text;
            console.log("Temporary transcription: ", text);
            tempTextEl.innerHTML = text;
        }
    }
    state.prevIsFinal = isFinal;
}

function startASR() {
    resamplerHandler.start();
    console.log("ASR Has started");
}

function stopASR() {
    resamplerHandler.stop()
        .then(() => asrHandler.reset())
        .then(updateTranscription)
        .catch(console.log)
        .finally(() => console.log("ASR Has been stopped"));
}



console.log("eeeeyy we got to the end")

const outputEl = document.querySelector("#output");
const tempTextEl = document.querySelector("#tempText");

document.querySelector("#startASR").addEventListener("click", () => {
    console.log("Clicked Start ASR");
    startASR();
    outputEl.innerHTML = "Started ASR";
});

document.querySelector("#downloadModel").addEventListener("click", () => {
    console.log("Clicked download model");
    outputEl.innerHTML = "Click";
    onModelChange("english_small");
    console.log("downloaded");
    outputEl.innerHTML = "Downloaded";
});

document.querySelector("#terminate").addEventListener("click", () => {
    console.log("Clicked terminate");
    stopASR();
    outputEl.innerHTML = "Terminated";
});

