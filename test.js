var express = require('express');
var app = express();

// Set the MIME type explicitly
express.static.mime.define({'application/wasm': ['wasm']});

app.use(express.static('./src'));

app.listen(3000);
console.log("Listening on port 3000: http://localhost:3000");