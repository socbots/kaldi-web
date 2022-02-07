const fs = require('fs');
const path = require('path');
const cors = require('cors');

const express = require('express');

const PORT = 4400;
const MODEL_DIR = path.join(__dirname, 'public');

const app = express();

function getCurrentTime() {
  const now = new Date();
  return `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
}

function getFilePath(filename) {
  const filepath = path.join(MODEL_DIR, `${filename}.zip`);
  if (fs.existsSync(filepath)) return filepath;
  throw new Error(`${filepath} not found`);
}

app.use(cors({origin: true}));

app.get('/models/:fileName', (req, res) => {
  try {
    const filepath = getFilePath(req.params.fileName);
    console.log(`[${getCurrentTime()}]: sending ${filepath} to ${req.ip}`);

    res.status(200);
    res.sendFile(filepath);
  } catch (err) {
    res.status(404);
    res.send(err.toString());
  }
});

function rmExtension(filepath) {
  return filepath.split('.').slice(0, -1).join('.');
}

app.get('/models', (req, res) => {
  const models = fs.readdirSync(MODEL_DIR);

  res.status(200);
  res.send(models.map(rmExtension));
});

app.get('/', (req, res) => {
  console.log(req.ip + " requested for /");
  res.status(200);
  res.send("You are at the root of the language model server");
});

const server = app.listen(PORT, '0.0.0.0', () => {
  const { address, port } = server.address();
  console.log(`Server running at http://${address}:${port}`);
});
