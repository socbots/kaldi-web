//import IDBHandler from './workerWrappers/idbHandler.js';
import ASRHandler from './workerWrappers/asrHandler.js';

import ResampleHandler from './workerWrappers/resamplerHandler.js';
import downloadModelFromWeb from './utils/downloadModel.js';

/**
 * This function sets everything up automatically from asking for microphone permission
 * to downloading the model and starting STT
 */
export class KaldiASR {
    constructor(modelURL, modelName) {
        this.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.onResampled = this.onResampled.bind(this);
        this.onModelChange = this.onModelChange.bind(this);
        this.startASR = this.startASR.bind(this);
        this.stopASR = this.stopASR.bind(this);
        this.updateTranscription = this.updateTranscription.bind(this);

        this.resamplerBufferSize = 4096; // ~ 90 ms at 44.1kHz
        this.modelURLPrefix = modelURL;
        this.modelName = modelName;
        this.robotCanListen = true;

        this.state = {
            prevIsFinal: false,
            transcriptions: [""],
            tmpTranscription: "",
        }

        // The kaldi ASR worker
        this.asrHandler = null;
        // Audio processing worker
        this.resamplerHandler = null;
    }

    async askForMicrophone() {
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                .then((stream) => {
                    const context = new this.AudioContext();
                    const audioSource = context.createMediaStreamSource(stream);
                    this.resamplerHandler = new ResampleHandler(audioSource,
                        this.onResampled, this.resamplerBufferSize);

                    resolve(true);
                })
                .catch((err) => {
                    console.error(err);
                    reject(false);
                });
        })
    }

    async init() {
        return new Promise(async (resolve, reject) => {
            this.asrHandler = new ASRHandler();
            await this.onModelChange(this.modelName)
            resolve();
            //.then(resolve)
            //.catch(reject);

        })
    }

    // This one downloads the model, initializes the ASR worker with it, sets up the audio handling
    // and currently also starts ASR so that you don't have to click all the buttons in the UI
    async onModelChange(modelName) {
        //return new Promise((resolve, reject) => {
        this.downloadAndStore(modelName)
            .then(({ value: zip }) => new Promise((resolve, reject) => {
                this.asrHandler.terminate()
                    .then(() => {
                        console.log("Initializing model");
                        resolve(this.asrHandler.init(modelName, zip));
                    })
                    .catch(reject);
            }))
            .then(() => this.asrHandler.getSampleRate())
            .then((asrSR) => this.resamplerHandler.setSampleRate(asrSR))
            .then(() => {
                console.log("model is set, starting ASR.....");
                this.startASR();
                return true;
            })
            .catch((err) => {
                console.error(err);
                return false;
            });
        // });
    }

    async asdf() {
        const ayy = "yoyoyo";
        if (Date.now() >= 9000) {
            return ayy;
        } else {
            return false;
        }
    }

    /**
     This function gets passed to the resamplerHandler constructor
     It gets called every time there's sound from the microphone and gives the audio buffer
     to asrHandler
     This is a pretty good place to decide if the robot should listen or not i think
     so robotCanListen is just a boolean that you can control when audio should be STT'd
    */
    onResampled(buffer) {
        if (this.robotCanListen) {
            this.asrHandler.process(buffer)
                .then(this.updateTranscription);
        }
    }

    downloadAndStore(modelName) {
        // prefix = "models". so it fetches from localhost:8080/models/:modelName which is actually a
        // a proxy to the express server at localhost:3300/models/:modelName
        return new Promise((resolve, reject) => {
            console.log("Downloading model");
            downloadModelFromWeb(`${this.modelURLPrefix}/${modelName}`)
                .then((zip) => { resolve({ value: zip }); })
                .catch(reject);
        });
    }

    /**
      This gets called every time kaldi has STT'd, the text gets emitted with a custom event
     */
    updateTranscription(transcription) {
        if (transcription === null) return;

        const { text, isFinal } = transcription;
        // skip streak of isFinal (i.e. repetition of final utterance)
        if (/*!state.prevIsFinal*/ true) {
            // bug: first trancript of new utterance always skipped
            if ((isFinal && text !== '') || !isFinal) {
                const { transcriptions } = this.state;
                this.state.transcriptions.push(text)
                this.state.tmpTranscription = '';
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
            this.state.prevIsFinal = isFinal;
        }
    }

    startASR() {
        this.resamplerHandler.start();
        console.log("ASR Has started");
    }

    stopASR() {
        this.resamplerHandler.stop()
            .then(() => this.asrHandler.reset())
            .then(this.updateTranscription)
            .catch(console.log)
            .finally(() => console.log("ASR Has been stopped"));
    }
}



/**
 * Comment all below when building, the code below is only for development!
 */
let kaldi;

async function main() {
    kaldi = new KaldiASR("models", "english_small");
    await kaldi.askForMicrophone();
    await kaldi.init();
}
main();

// Listen to the custom event that was created in updateTranscription
window.addEventListener("onTranscription", (msg) => {
    const outputEl = document.querySelector("#output");
    const tempTextEl = document.querySelector("#tempText");
    const { transcription } = msg.detail;

    if (msg.detail.isFinal) {
        outputEl.innerHTML = `${outputEl.innerHTML} <br> ${transcription}`;
        if (["blue", "green", "red"].includes(transcription)) {
            document.body.style.background = transcription;
        }
    } else {
        tempTextEl.innerHTML = msg.detail.transcription;
    }
});

const listenToggle = document.querySelector("#listenToggle");

listenToggle.addEventListener("click", (e) => {
    kaldi.robotCanListen = !kaldi.robotCanListen;
    listenToggle.innerHTML = `Listening: ${kaldi.robotCanListen}`;
});
