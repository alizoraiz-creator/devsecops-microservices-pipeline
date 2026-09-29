const express = require('express');
const helmet = require('helmet');
const winston = require('winston');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8081;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:8080';

// Structured Logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'order-service' },
  transports: [
    new winston.transports.Console()
  ],
});

// Security Middlewares
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Middleware to verify token via Auth Service
const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    logger.warn('Unauthorized order attempt - no token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/verify`, {}, {
      headers: { Authorization: token },
      timeout: 2000
    });
    
    if (response.data.valid) {
      req.user = response.data.user;
      next();
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  } catch (error) {
    logger.error(`Error verifying token with auth-service: ${error.message}`);
    res.status(403).json({ error: 'Forbidden' });
  }
};

// Create Order Endpoint
app.post('/api/orders', requireAuth, (req, res) => {
  const { item, quantity } = req.body;
  
  if (!item || !quantity) {
    return res.status(400).json({ error: 'Item and quantity required' });
  }

  const orderId = `ORD-${Math.floor(Math.random() * 10000)}`;
  logger.info(`Order ${orderId} created successfully by user ${req.user.username}`);
  
  res.status(201).json({ 
    message: 'Order created', 
    orderId,
    user: req.user.username 
  });
});

app.listen(PORT, () => {
  logger.info(`Order service listening on port ${PORT}`);
});
