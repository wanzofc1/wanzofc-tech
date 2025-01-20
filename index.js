const express = require("express");
const cors = require("cors");
const secure = require("ssl-express-www");
const bodyParser = require("body-parser");
const path = require("path");
const os = require("os");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const ptz = require("./function/index");

const app = express();
app.enable("trust proxy");
app.set("json spaces", 2);

// Middleware
app.use(cors());
app.use(secure);
app.use(bodyParser.json()); // Parsing JSON
app.use(bodyParser.urlencoded({ extended: true })); // Parsing URL Encoded Data
app.use(express.static(path.join(__dirname, "public")));

const port = 3000;
const JWT_SECRET = "abcdefghijklmnopqrstuvwxyz"; // Ganti dengan yang lebih aman
const API_KEY = "abcdefghijklmnopqrstuvwxyz"; // API Key default

// Middleware: Verifikasi Token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(403).json({ error: "Token tidak ditemukan" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Token tidak valid" });
    }
    req.user = decoded; // Simpan informasi pengguna di req
    next();
  });
};

// Middleware: Verifikasi API Key
const verifyApiKey = (req, res, next) => {
  const apiKey = req.query.apiKey;
  if (apiKey !== API_KEY) {
    return res.status(403).json({ error: "API Key tidak valid" });
  }
  next();
};

// Endpoint Utama (Home)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Endpoint Stats
app.get("/stats", verifyToken, (req, res) => {
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
    memoryUsage: process.memoryUsage(),
  };
  res.json(stats);
});

// Endpoint Admin
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// Generate Token JWT
app.post("/admin/generateToken", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Username atau password salah" });
  }
});

// Set Batasan API
app.post("/admin/setLimits", (req, res) => {
  const { apiLimit, customApiKey } = req.body;

  if (!apiLimit || !customApiKey) {
    return res.status(400).json({ error: "API Limit atau API Key tidak lengkap" });
  }

  const config = { apiLimit, customApiKey };
  fs.writeFileSync("config.json", JSON.stringify(config));
  res.status(200).json({ message: "Batasan dan API Key berhasil disetting" });
});

// Endpoint Ragbot
app.get("/api/ragbot", verifyToken, verifyApiKey, async (req, res) => {
  try {
    const message = req.query.message;
    if (!message) {
      return res.status(400).json({ error: 'Parameter "message" tidak ditemukan' });
    }
    const response = await ptz.ragBot(message);
    res.status(200).json({ status: 200, creator: "aabrayy", data: { response } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint DegreeGuru
app.get("/api/degreeguru", verifyToken, verifyApiKey, async (req, res) => {
  try {
    const message = req.query.message;
    if (!message) {
      return res.status(400).json({ error: 'Parameter "message" tidak ditemukan' });
    }
    const response = await ptz.degreeGuru(message);
    res.status(200).json({ status: 200, creator: "aabrayy", data: { response } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint SmartContract
app.get("/api/smartcontract", verifyToken, verifyApiKey, async (req, res) => {
  try {
    const message = req.query.message;
    if (!message) {
      return res.status(400).json({ error: 'Parameter "message" tidak ditemukan' });
    }
    const response = await ptz.smartContract(message);
    res.status(200).json({ status: 200, creator: "aabrayy", data: { response } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint BlackboxAIChat
app.get("/api/blackboxAIChat", verifyToken, verifyApiKey, async (req, res) => {
  try {
    const message = req.query.message;
    if (!message) {
      return res.status(400).json({ error: 'Parameter "message" tidak ditemukan' });
    }
    const response = await ptz.blackboxAIChat(message);
    res.status(200).json({ status: 200, creator: "aabrayy", data: { response } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint GPT
app.get("/api/gpt", verifyToken, verifyApiKey, async (req, res) => {
  const text = req.query.text;

  if (!text) {
    return res.status(400).json({ error: "Parameter 'text' is required." });
  }

  try {
    const requestData = {
      operation: "chatExecute",
      params: {
        text,
        languageId: "6094f9b4addddd000c04c94b",
        toneId: "60572a649bdd4272b8fe358c",
        voiceId: "",
      },
    };

    const config = {
      headers: {
        Accept: "application/json, text/plain, */*",
        Authentication: "Bearer your-bearer-token-here",
        "Content-Type": "application/json",
      },
    };
    const { data } = await axios.post("https://api.rytr.me/", requestData, config);
    data.data.content = data.data.content.replace(/<\/?p[^>]*>/g, "");
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Middleware untuk 404 dan Error Handler
app.use((req, res) => res.status(404).send("Halaman tidak ditemukan"));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Ada kesalahan pada server");
});

// Jalankan Server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
