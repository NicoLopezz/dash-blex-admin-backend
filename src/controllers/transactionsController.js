const db = require('../config/database');

/**
 * Obtener transacciones con información de usuarios y wallets
 */
const getUserTransactions = async (req, res) => {
  try {
    const { startDate = '2025-01-01', userId, currency } = req.query;

    let query = `
      SELECT
        u.id as user_id,
        u.name as user_name,
        u.email,
        u.cuit,
        w.slug as currency,
        ROUND(w.balance::numeric / 100, 2) as current_balance,
        t.id as transaction_id,
        t.type as transaction_type,
        ROUND(t.amount::numeric / 100, 2) as amount,
        t.confirmed,
        t.meta->>'concept' as concept,
        t.meta->>'description' as description,
        t.created_at as transaction_date
      FROM users u
      JOIN wallets w ON w.holder_id = u.id AND w.holder_type = 'App\\Models\\User'
      LEFT JOIN transactions t ON t.wallet_id = w.id
      WHERE t.created_at >= $1
    `;

    const params = [startDate];
    let paramIndex = 2;

    // Filtro opcional por usuario
    if (userId) {
      query += ` AND u.id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    // Filtro opcional por moneda
    if (currency) {
      query += ` AND w.slug = $${paramIndex}`;
      params.push(currency);
      paramIndex++;
    }

    query += ` ORDER BY u.id, w.slug, t.created_at DESC`;

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      filters: {
        startDate,
        userId: userId || 'all',
        currency: currency || 'all',
      },
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener transacciones',
      error: error.message,
    });
  }
};

/**
 * Obtener resumen de transacciones por usuario
 */
const getTransactionsSummary = async (req, res) => {
  try {
    const { startDate = '2025-01-01' } = req.query;

    const query = `
      SELECT
        u.id as user_id,
        u.name as user_name,
        u.email,
        COUNT(t.id) as total_transactions,
        COUNT(CASE WHEN t.confirmed THEN 1 END) as confirmed_transactions,
        COUNT(CASE WHEN NOT t.confirmed THEN 1 END) as pending_transactions,
        json_agg(
          DISTINCT jsonb_build_object(
            'currency', w.slug,
            'balance', ROUND(w.balance::numeric / 100, 2)
          )
        ) as wallets
      FROM users u
      JOIN wallets w ON w.holder_id = u.id AND w.holder_type = 'App\\Models\\User'
      LEFT JOIN transactions t ON t.wallet_id = w.id
      WHERE t.created_at >= $1
      GROUP BY u.id, u.name, u.email
      ORDER BY total_transactions DESC
    `;

    const result = await db.query(query, [startDate]);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      startDate,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de transacciones',
      error: error.message,
    });
  }
};

/**
 * Obtener estadísticas de transacciones por moneda
 */
const getTransactionsByCurrency = async (req, res) => {
  try {
    const { startDate = '2025-01-01' } = req.query;

    const query = `
      SELECT
        w.slug as currency,
        COUNT(t.id) as total_transactions,
        COUNT(DISTINCT u.id) as unique_users,
        SUM(CASE WHEN t.type = 'deposit' THEN t.amount ELSE 0 END)::numeric / 100 as total_deposits,
        SUM(CASE WHEN t.type = 'withdraw' THEN t.amount ELSE 0 END)::numeric / 100 as total_withdrawals,
        ROUND(SUM(w.balance)::numeric / 100, 2) as total_balance
      FROM wallets w
      JOIN users u ON w.holder_id = u.id AND w.holder_type = 'App\\Models\\User'
      LEFT JOIN transactions t ON t.wallet_id = w.id
      WHERE t.created_at >= $1
      GROUP BY w.slug
      ORDER BY total_transactions DESC
    `;

    const result = await db.query(query, [startDate]);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      startDate,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas por moneda:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas por moneda',
      error: error.message,
    });
  }
};

module.exports = {
  getUserTransactions,
  getTransactionsSummary,
  getTransactionsByCurrency,
};
