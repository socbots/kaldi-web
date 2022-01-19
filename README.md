# baldi-web
*kaldi-web but without the unnecessary cruft on top*

[Kaldi-web](https://gitlab.inria.fr/kaldi.web/kaldi-wasm) is an on-device, in-browser speech recognition system, compiled from Kaldi into web assembly. The project is developed by researchers at Université de Lorraine. The authors have written a paper explaining what they've done: https://hal.archives-ouvertes.fr/hal-02910876/document . Their GitLab also has a wiki!
Kaldi-web comes with a demo frontend for trying out the ASR, though with the disadvantage that the ASR package is tightly coupled to the React frontend. This means that using kaldi-web in other 
websites and apps requires significant work.

Baldi-web is a fork of kaldi-web, modified into a library to more easily embed into other websites.
The language models are downloaded through the internet, the repo includes a NodeJS Express script to serve them.

The audio is transcripted continously, so results are returned while the user is speaking, allowing for low-latency interaction.
The package has automatic silence detection, determining when the user has finished speaking. The final transcription also has better accuracy.

## Usage
### Frontend
The compiled library is in the `build` folder. 
1. To use it on your own website, first make a folder named "kaldi" in the root of the served folder. Unfortunately it must be in the root
because of how WebPack handles the source file's http requests. (Suggestions appreciated)
2. Copy all contents **except** `index.html` into the kaldi folder.
3. You only need to reference the main script:
```html
<script src="kaldi/kaldi.main.js" defer></script>
```

1. The module is initialized with a URL to the model server, and name of the language model. 
2. You must then ask for microphone access, and finally call `init` to start downloading and listening.
Kaldi-web is asynchronous, so the initialization must happen inside an async function using `await`, or using `.then()` callback functions.

The speech to text transcriptions are emitted to a custom event called `onTranscription`. The content exists as an object on `event.detail`:
```js
{
    transcription: (string) The text
    isFinal: (bool) Tells if the result is mid-sentence or the user has finished speaking
}
```

#### Example implementation
Initialization
```js
let kaldi;

async function kaldiMain() {
    // Initializes the kaldiweb class. The 2nd param is the name of the model to download/use.
    kaldi = new KaldiWeb.KaldiASR("https://johan.onl/models", "english");
    // getUserMedia
    await kaldi.askForMicrophone();
    // Download the model and start listening.
    await kaldi.init();

    // The instance is now listening and outputting results to the custom "onTranscription" event
}
kaldiMain();
```
Listen for transcriptions
```js
// Listen to the custom event that emits new transcriptions.
// Audio is transcripted continuously while the person is talking.
window.addEventListener("onTranscription", (msg) => {
    const { transcription, isFinal } = msg.detail;
    console.log("Transcription:", transcription);

    // Run check input only if there was text in the transcription.
    if (transcription) {
        document.querySelector("body").appendChild(document.createTextNode(transcription))
    }
});
```

### Backend
The package expects the language models to be in `<givenURL>/<givenModelName>` i.e. `https://example.com/english`
The express server `models_server.js` in this repo serves the models at `http://127.0.0.1:4400/models/<givenModelName>`.
To use this express server:
1. Download the zip files from https://people.arcada.fi/~penttinj/socbots/kaldi/models/ and place them in `public/`
2. `npm install`
3. `node models_server.js`


## Development
Uncomment all code at the bottom of `index.js` if it's commented out.
Run the front and backend servers:
1. Download the zip files from https://people.arcada.fi/~penttinj/socbots/kaldi/models/ and place them in `public/`
2. `npm install`
3. Comment out `publicPath: '/kaldi/',` in `webpack.config.js`. Else the webpack dev server won't find index.html.
4. `npm run dev`
5. Enjoy! Start with index.js and root through the spaghetti.
6. `npm run build` to compile into the build folder.
    - Remember to comment all the frontend code in index.js before building.
    - Uncomment `publicPath: '/kaldi/',` in `webpack.config.js`.

---
Check out the [kaldi-web wiki](https://gitlab.inria.fr/kaldi.web/kaldi-wasm/-/wikis/home) for more explanations!