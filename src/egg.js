// import { spam } from "./ham.js";
//import IDBHandler from './workerWrappers/idbHandler.js';
import ASRHandler from './workerWrappers/asrHandler.js';
/*
import ResampleHandler from './workerWrappers/resamplerHandler.js';
import downloadModelFromWeb from './utils/downloadModel.js';
*/
console.log('World!');
let wasm;

WebAssembly.compileStreaming(fetch("computations/kaldiJS.wasm")).then(module => {
    console.log("Imported the module");
    console.log(module);
})


console.log("eeeeyy")


const something = {
    locateFile(path) {
      console.log("Path is:", path);
      if (path.endsWith('.wasm')) return kaldiWasm;
      return path;
    },
  }

console.log(something);