const db = require('../config/database');

/**
 * Health check endpoint
 */
const healthCheck = async (req, res) => {
  try {
    const dbStatus = await db.testConnection();

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = {
  healthCheck,
};
