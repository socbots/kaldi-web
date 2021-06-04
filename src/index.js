//import IDBHandler from './workerWrappers/idbHandler.js';
import ASRHandler from './workerWrappers/asrHandler.js';

import ResampleHandler from './workerWrappers/resamplerHandler.js';
import downloadModelFromWeb from './utils/downloadModel.js';

/**
 * This function sets everything up automatically from asking for microphone permission
 * to downloading the model and starting STT
 * It's really ugly now tho and writes and reads from html elements
 * TODO: It should also probably be turned into a class
 */
function initKaldi() {

    const AudioContext = window.AudioContext || window.webkitAudioContext;

    const config = {
        resamplerBufferSize: 4096, // ~ 90 ms at 44.1kHz
        modelURLPrefix: 'models',
        // modelURLPrefix: "https://people.arcada.fi/~penttinj/socbots/kaldi/models/", // no CORS on peoplearcada :(
    };

    const state = {
        prevIsFinal: false,
        transcriptions: [""],
        tmpTranscription: "",
        robotCanListen: true,
    }

    // The kaldi ASR worker
    const asrHandler = new ASRHandler();
    // Audio processing worker
    let resamplerHandler;

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((stream) => {
            const context = new AudioContext();
            const audioSource = context.createMediaStreamSource(stream);
            resamplerHandler = new ResampleHandler(audioSource,
                onResampled, config.resamplerBufferSize);
        })
        .then(() => console.log("")) // This is to stall out to get resamplerHandler initialized before continuin
        .catch(console.error);


    // This one downloads the model, initializes the ASR worker with it, sets up the audio handling
    // and currently also starts ASR so that you don't have to click all the buttons in the UI
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
            .then(() => {
                console.log("model is set, starting ASR.....");
                startASR();
            })
            .catch(console.error);
    }

    /**
     This function gets passed to the resamplerHandler constructor
     It gets called every time there's sound from the microphone and gives the audio buffer
     to asrHandler
     This is a pretty good place to decide if the robot should listen or not i think
     so robotCanListen is just a boolean that you can control when audio should be STT'd
    */
    function onResampled(buffer) {
        const { robotCanListen } = state;
        if (robotCanListen) {
            asrHandler.process(buffer)
                .then(updateTranscription);
        }
    }

    function downloadAndStore(modelName) {
        // prefix = "models". so it fetches from localhost:8080/models/:modelName which is actually a
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

    /**
      This gets called every time kaldi has STT'd, the text gets emitted with a custom event
     */
    function updateTranscription(transcription) {
        if (transcription === null) return;

        const { text, isFinal } = transcription;
        // skip streak of isFinal (i.e. repetition of final utterance)
        if (/*!state.prevIsFinal*/ true) {
            // bug: first trancript of new utterance always skipped
            if ((isFinal && text !== '') || !isFinal) {
                const { transcriptions } = state;
                state.transcriptions.push(text)
                state.tmpTranscription = '';
                console.log("Transcription: ", text);

                // A custom event listener for announcing every time a new transcription is available
                const evt = new CustomEvent("onTranscription", {
                    detail: {
                        isFinal,
                        transcription: text
                    }
                });
                dispatchEvent(evt);
            }
            state.prevIsFinal = isFinal;
        }
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


    document.querySelector("#startASR").addEventListener("click", () => {
        console.log("Clicked Start ASR");
        startASR();
        outputEl.innerHTML = "ASR has started";
    });

    document.querySelector("#downloadModel").addEventListener("click", () => {
        console.log("Clicked download model");
        outputEl.innerHTML = "Click";
        onModelChange(document.querySelector("#models").value);
        console.log(document.querySelector("#models").value);
        console.log("downloaded");
        outputEl.innerHTML = "Downloaded";
    });

    document.querySelector("#terminate").addEventListener("click", () => {
        console.log("Clicked terminate");
        stopASR();
        outputEl.innerHTML = "Terminated";
    });


    onModelChange(document.querySelector("#models").value)
}

const outputEl = document.querySelector("#output");
const tempTextEl = document.querySelector("#tempText");

initKaldi()


// Listen to the custom event that was created in updateTranscription
window.addEventListener("onTranscription", (msg) => {
    const { transcription } = msg.detail;
    if (msg.detail.isFinal) {
        outputEl.innerHTML = `${outputEl.innerHTML} <br> ${transcription}`;
        if (["blue", "green", "red"].includes(transcription)) {
            document.body.style.background = transcription;
        }
    } else {
        tempTextEl.innerHTML = msg.detail.transcription;
    }
})