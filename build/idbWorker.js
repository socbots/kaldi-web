!function(e){var n={};function t(r){if(n[r])return n[r].exports;var o=n[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,t),o.l=!0,o.exports}t.m=e,t.c=n,t.d=function(e,n,r){t.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:r})},t.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},t.t=function(e,n){if(1&n&&(e=t(e)),8&n)return e;if(4&n&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(t.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var o in e)t.d(r,o,function(n){return e[n]}.bind(null,o));return r},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},t.p="kaldi/",t(t.s=0)}([function(e,n){let t=null,r=null;function o(e,n){return new Promise((o,a)=>{const i=indexedDB.open(e,n);i.onupgradeneeded=e=>{r=i.result,function(e,n){if(0!==n)throw new Error("IDB version upgrade not implemented");e.createObjectStore(t.name,{keyPath:t.keyPath})}(r,e.oldVersion)},i.addEventListener("success",()=>{r=i.result,function(){const e=r.transaction(t.name).objectStore(t.name);return new Promise((n,t)=>{const r=e.getAllKeys();r.addEventListener("success",()=>n(r.result)),r.addEventListener("error",t)})}().then(o).catch(a)}),i.addEventListener("error",a)})}function a(e){return new Promise((n,o)=>{(function(e){const n=r.transaction(t.name).objectStore(t.name).get(e);return new Promise((e,t)=>{n.addEventListener("success",()=>{void 0===n.result?t(n.result):e(n.result)}),n.addEventListener("error",t)})})(e).then(n).catch(e=>{o(e)})})}const i={async init(e){const{idbInfo:n}=e.data,{storeInfo:r}=n;return t={name:r.name,keyPath:r.keyPath},o(n.name,n.version)},async get(e){if(null===r)throw new Error("DB not initialized");return a(e.data.modelName)},add(e){if(null===r)throw new Error("DB not initialized");return n=e.data.modelName,o=e.data.zip,new Promise((e,a)=>{const i=r.transaction(t.name,"readwrite"),u={value:o,[t.keyPath]:n};i.oncomplete=()=>{e(u)},i.objectStore(t.name).add(u).onerror=e=>{a(e.target.error)}});var n,o},terminate(){null!==r&&r.close()}};onmessage=e=>{const{command:n}=e.data,t={command:n,ok:!0};n in i?i[n](e).then(e=>{t.value=e}).catch(e=>{t.ok=!1,t.value=e}).finally(()=>{postMessage(t)}):(t.ok=!1,t.value=new Error(`Unknown command '${n}'`),postMessage(t))}}]);