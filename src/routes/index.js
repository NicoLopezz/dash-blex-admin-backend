const express = require('express');
const router = express.Router();

// Controllers
const healthController = require('../controllers/healthController');
const productsController = require('../controllers/productsController');
const transactionsController = require('../controllers/transactionsController');

// Health check
router.get('/health', healthController.healthCheck);

// Products routes
router.get('/products', productsController.getAllProducts);
router.get('/products/:id', productsController.getProductById);
router.post('/products', productsController.createProduct);
router.put('/products/:id', productsController.updateProduct);
router.delete('/products/:id', productsController.deleteProduct);

// Transactions routes
router.get('/transactions', transactionsController.getUserTransactions);
router.get('/transactions/summary', transactionsController.getTransactionsSummary);
router.get('/transactions/by-currency', transactionsController.getTransactionsByCurrency);

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Blex Dashboard API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      products: {
        getAll: 'GET /api/products',
        getById: 'GET /api/products/:id',
        create: 'POST /api/products',
        update: 'PUT /api/products/:id',
        delete: 'DELETE /api/products/:id',
      },
      transactions: {
        getAll: 'GET /api/transactions?startDate=2025-01-01&userId=1&currency=ARS',
        summary: 'GET /api/transactions/summary?startDate=2025-01-01',
        byCurrency: 'GET /api/transactions/by-currency?startDate=2025-01-01',
      },
    },
  });
});

module.exports = router;
