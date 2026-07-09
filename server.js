const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fashion-website';
// JWT and admin env vars removed — login/register disabled

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => console.error('MongoDB connection error:', err));

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  ipAddress: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now }
});

const visitorSchema = new mongoose.Schema({
  ipAddress: String,
  userAgent: String,
  path: String,
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);
const Visitor = mongoose.model('Visitor', visitorSchema);

function getClientInfo(req) {
  const ipAddress = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  return { ipAddress, userAgent };
}

function sendError(res, status, message, err) {
  const payload = { success: false, message };
  if (err) payload.error = err.message || String(err);
  return res.status(status).json(payload);
}

// Authentication helpers removed — login/register disabled

async function ensureMongoReady() {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
}

// admin user creation removed per user request

app.post('/api/contact', async (req, res) => {
  try {
    await ensureMongoReady();

    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return sendError(res, 400, 'Name, email, and message are required.');
    }

    const { ipAddress, userAgent } = getClientInfo(req);
    const contact = await Contact.create({ name, email, message, ipAddress, userAgent });
    return res.status(201).json({ success: true, data: contact });
  } catch (err) {
    return sendError(res, 500, 'Unable to save your message right now. Please try again later.', err);
  }
});

// Registration and login endpoints removed per user request

// admin login removed per user request

// /api/me removed — auth disabled

// Admin routes removed per user preference — backend will only accept/store contacts

app.post('/api/track', async (req, res) => {
  try {
    const { path } = req.body;
    const { ipAddress, userAgent } = getClientInfo(req);

    await Visitor.create({ ipAddress, userAgent, path });
    res.json({ success: true });
  } catch (err) {
    return sendError(res, 500, 'Unable to track visitor.', err);
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'fashion.html'));
});

// Admin UI removed

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
