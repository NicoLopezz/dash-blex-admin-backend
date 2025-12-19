const express = require('express');
const router = express.Router();

// Controllers
const healthController = require('../controllers/healthController');
const productsController = require('../controllers/productsController');
const transactionsController = require('../controllers/transactionsController');
const usersController = require('../controllers/usersController');
const dashboardController = require('../controllers/dashboardController');
const billingController = require('../controllers/billingController');
const debugController = require('../controllers/debugController');
const authController = require('../controllers/authController');

// Health check
router.get('/health', healthController.healthCheck);

// Auth routes (públicas - autenticación basada en sesión)
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authController.getMe);

// Debug routes (temporal)
router.get('/debug/schema', debugController.getTableSchema);
router.get('/debug/sample', debugController.getSampleData);

// Users routes - PRIORIDAD ALTA
router.get('/users', usersController.getAllUsers);
router.get('/users/:id', usersController.getUserById);
router.post('/users', usersController.createUser);
router.put('/users/:id', usersController.updateUser);
router.delete('/users/:id', usersController.deleteUser);

// User transactions - PRIORIDAD ALTA
router.get('/users/:userId/transactions', transactionsController.getUserTransactionsByUserId);
router.get('/users/:userId/transactions/incremental', transactionsController.getUserTransactionsIncremental);
router.get('/users/:userId/transactions/since', transactionsController.getNewTransactionsSince);

// Dashboard routes - PRIORIDAD ALTA
router.get('/dashboard/stats', dashboardController.getDashboardStats);
router.get('/dashboard/chart/monthly-movement', dashboardController.getMonthlyMovement);
router.get('/dashboard/report/all-users-transactions', dashboardController.getAllUsersTransactionsReport);
router.get('/dashboard/report/users-last-transaction', dashboardController.getUsersLastTransactionReport);
router.get('/dashboard/report/user-transactions/:cvu', dashboardController.getUserTransactionsByCVU);

// Transactions routes - PRIORIDAD MEDIA
router.get('/transactions/recent', dashboardController.getRecentTransactions);
router.get('/transactions', transactionsController.getUserTransactions);
router.get('/transactions/summary', transactionsController.getTransactionsSummary);
router.get('/transactions/by-currency', transactionsController.getTransactionsByCurrency);
router.post('/transactions', transactionsController.createTransaction);

// Billing routes - PRIORIDAD BAJA
router.get('/invoices', billingController.getInvoices);
router.get('/billing/transactions', billingController.getBillingTransactions);

// Products routes (legacy)
router.get('/products', productsController.getAllProducts);
router.get('/products/:id', productsController.getProductById);
router.post('/products', productsController.createProduct);
router.put('/products/:id', productsController.updateProduct);
router.delete('/products/:id', productsController.deleteProduct);

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Blex Dashboard API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        me: 'GET /api/auth/me (requiere token)',
        logout: 'POST /api/auth/logout',
      },
      users: {
        getAll: 'GET /api/users?search=&status=&page=1&limit=10',
        getById: 'GET /api/users/:id',
        create: 'POST /api/users',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id',
        transactions: 'GET /api/users/:userId/transactions?page=1&limit=50',
      },
      dashboard: {
        stats: 'GET /api/dashboard/stats',
        monthlyMovement: 'GET /api/dashboard/chart/monthly-movement?moneda=ARS&year=2025',
        allUsersTransactions: 'GET /api/dashboard/report/all-users-transactions?endDate=2024-12-31 23:59:59',
        usersLastTransaction: 'GET /api/dashboard/report/users-last-transaction',
        userTransactionsByCVU: 'GET /api/dashboard/report/user-transactions/:cvu?endDate=2024-12-31 23:59:59',
      },
      transactions: {
        recent: 'GET /api/transactions/recent?limit=5',
        getAll: 'GET /api/transactions?startDate=2025-01-01&userId=1&currency=ARS',
        summary: 'GET /api/transactions/summary?startDate=2025-01-01',
        byCurrency: 'GET /api/transactions/by-currency?startDate=2025-01-01',
        create: 'POST /api/transactions',
      },
      billing: {
        invoices: 'GET /api/invoices?limit=5',
        transactions: 'GET /api/billing/transactions',
      },
      products: {
        getAll: 'GET /api/products',
        getById: 'GET /api/products/:id',
        create: 'POST /api/products',
        update: 'PUT /api/products/:id',
        delete: 'DELETE /api/products/:id',
      },
    },
  });
});

module.exports = router;
