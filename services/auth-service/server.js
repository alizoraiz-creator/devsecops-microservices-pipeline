const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Structured Logging Configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'auth-service' },
  transports: [
    new winston.transports.Console()
  ],
});

// Load secrets from CSI driver mount
const getSecret = (secretName, defaultValue = '') => {
  try {
    const path = `/mnt/secrets-store/${secretName}`;
    if (fs.existsSync(path)) {
      return fs.readFileSync(path, 'utf8').trim();
    }
    logger.warn(`Secret ${secretName} not found at ${path}, using fallback`);
    return defaultValue;
  } catch (err) {
    logger.error(`Error reading secret ${secretName}: ${err.message}`);
    return defaultValue;
  }
};

const JWT_SECRET = getSecret('jwt-secret', 'fallback-insecure-secret');

// Security Middlewares
app.use(helmet());
app.use(express.json({ limit: '10kb' })); // Limit body payload

// Rate Limiting (Prevent Brute-Force)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  }
});
app.use('/api/', apiLimiter);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Authentication Endpoint (Mock implementation for demonstration)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  // Basic mock auth
  if (username === 'admin' && password === 'password123') { // In production, use bcrypt and a DB
    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    logger.info(`Successful login for user: ${username}`);
    res.json({ token });
  } else {
    logger.warn(`Failed login attempt for user: ${username}`);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Token Verification Endpoint (used by other services)
app.post('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    logger.warn(`Invalid token verification attempt: ${err.message}`);
    res.status(403).json({ error: 'Invalid token' });
  }
});

app.listen(PORT, () => {
  logger.info(`Auth service listening on port ${PORT}`);
});
