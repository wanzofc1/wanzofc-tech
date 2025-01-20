var express = require("express"), cors = require("cors"), secure = require("ssl-express-www");
const path = require('path');
const os = require('os');
const fs = require('fs');
const ptz = require('./function/index');
const axios = require('axios');
const jwt = require('jsonwebtoken'); // Untuk JWT Authentication

var app = express();
app.enable("trust proxy");
app.set("json spaces", 2);
app.use(cors());
app.use(secure);
app.use(express.static(path.join(__dirname, 'public')));
const port = 3000;

// Middleware untuk memverifikasi JWT Token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(403).send({ error: 'Token tidak ditemukan' });
  }

  jwt.verify(token, 'abcdefghijklmnopqrstuvwxyz', (err, decoded) => {
    if (err) {
      return res.status(403).send({ error: 'Token tidak valid' });
    }
    req.user = decoded;
    next();
  });
};

// Middleware untuk memverifikasi API Key
const verifyApiKey = (req, res, next) => {
  const apiKey = req.query.apiKey;
  if (apiKey !== 'abcdefghijklmnopqrstuvwxyz') {
    return res.status(403).json({ error: 'API Key tidak valid' });
  }
  next();
};

// Endpoint Stats
app.get('/stats', verifyToken, (req, res) => {
  const stats = {
    platform: os.platform(),
    architecture: os.arch(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime(),
    cpuModel: os.cpus()[0].model,
    numCores: os.cpus().length,
    loadAverage: os.loadavg(),
    hostname: os.hostname(),
    networkInterfaces: os.networkInterfaces(),
    osType: os.type(),
    osRelease: os.release(),
    userInfo: os.userInfo(),
    processId: process.pid,
    nodeVersion: process.version,
    execPath: process.execPath,
    cwd: process.cwd(),
    memoryUsage: process.memoryUsage()
  };
  res.json(stats);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


// Endpoint Admin untuk Mengatur Batasan API
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Endpoint untuk mengatur batasan API melalui Admin
app.post('/admin/setLimits', (req, res) => {
  // Fungsi untuk mengatur batasan di sini
  const { apiLimit, customApiKey } = req.body;
  if (!apiLimit || !customApiKey) {
    return res.status(400).json({ error: 'API Limit atau API Key tidak lengkap' });
  }

  // Simpan pengaturan ke dalam database atau file konfigurasi
  // Misalnya, menyimpan dalam file JSON atau database:
  const config = { apiLimit, customApiKey };
  fs.writeFileSync('config.json', JSON.stringify(config));

  res.status(200).json({ message: 'Batasan dan API Key berhasil disetting' });
});

// Ragbot Endpoint
app.get('/api/ragbot', verifyToken, verifyApiKey, async (req, res) => {
  try {
    const message = req.query.message;
    if (!message) {
      return res.status(400).json({ error: 'Parameter "message" tidak ditemukan' });
    }
    const response = await ptz.ragBot(message);
    res.status(200).json({
      status: 200,
      creator: "aabrayy",
      data: { response }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/generateToken', (req, res) => {
  const { username, password } = req.body;

  // Validasi username dan password
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ username }, 'your-secret-key', { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Username atau password salah' });
  }
});

// DegreeGuru Endpoint
app.get('/api/degreeguru', verifyToken, verifyApiKey, async (req, res) => {
  try {
    const { message } = req.query;
    if (!message) {
      return res.status(400).json({ error: 'Parameter "message" tidak ditemukan' });
    }
    const response = await ptz.degreeGuru(message);
    res.status(200).json({
      status: 200,
      creator: "aabrayy",
      data: { response }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SmartContract Endpoint
app.get('/api/smartcontract', verifyToken, verifyApiKey, async (req, res) => {
  try {
    const message = req.query.message;
    if (!message) {
      return res.status(400).json({ error: 'Parameter "message" tidak ditemukan' });
    }
    const response = await ptz.smartContract(message);
    res.status(200).json({
      status: 200,
      creator: "aabrayy",
      data: { response }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BlackboxAIChat Endpoint
app.get('/api/blackboxAIChat', verifyToken, verifyApiKey, async (req, res) => {
  try {
    const message = req.query.message;
    if (!message) {
      return res.status(400).json({ error: 'Parameter "message" tidak ditemukan' });
    }
    const response = await ptz.blackboxAIChat(message);
    res.status(200).json({
      status: 200,
      creator: "aabrayy",
      data: { response }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GPT Endpoint
app.get("/api/gpt", verifyToken, verifyApiKey, async (req, res) => {
  const text = req.query.text;

  if (!text) {
    return res.status(400).send("Parameter 'text' is required.");
  }

  try {
    const requestData = {
      operation: "chatExecute",
      params: {
        text: text,
        languageId: "6094f9b4addddd000c04c94b",
        toneId: "60572a649bdd4272b8fe358c",
        voiceId: ""
      }
    };

    const config = {
      headers: {
        Accept: "application/json, text/plain, */*",
        Authentication: "Bearer your-bearer-token-here",
        "Content-Type": "application/json"
      }
    };
    let { data } = await axios.post("https://api.rytr.me/", requestData, config);
    data.data.content = data.data.content.replace(/<\/?p[^>]*>/g, '');
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.use((req, res, next) => {
  res.status(404).send("Halaman tidak ditemukan");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Ada kesalahan pada server');
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
