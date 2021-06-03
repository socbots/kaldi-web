//import IDBWorker from '../workers/idbWorker.js';
import WorkerWrapper from './workerWrapper.js';

export default class IDBHandler extends WorkerWrapper {
  constructor() {
    //super(new IDBWorker());
    super(new Worker('../workers/idbWorker.js'));
  }

  init(idbInfo) {
    return this.promisify('init', { idbInfo });
  }

  get(modelName) {
    return this.promisify('get', { modelName });
  }

  add(modelName, zip) {
    return this.promisify('add', { modelName, zip });
  }

  terminate() {
    this.idbWorker.postMessage({ command: 'terminate' });
  }
}
