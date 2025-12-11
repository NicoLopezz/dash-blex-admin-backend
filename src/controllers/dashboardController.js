const db = require('../config/database');

/**
 * GET /api/dashboard/stats
 * Obtener estadísticas generales del sistema
 */
const getDashboardStats = async (req, res) => {
  try {
    // Obtener conteos de usuarios activos e inactivos
    const usersStatsQuery = `
      SELECT
        COUNT(*) FILTER (WHERE account_state = 'active') as "usuariosActivos",
        COUNT(*) FILTER (WHERE account_state != 'active') as "usuariosInactivos"
      FROM users
    `;

    // Obtener balances totales por moneda
    const balancesQuery = `
      SELECT
        w.slug as currency,
        ROUND(SUM(w.balance)::numeric / 100, 2) as total_balance
      FROM wallets w
      WHERE w.holder_type = 'App\\Models\\User'
      GROUP BY w.slug
    `;

    const [usersStatsResult, balancesResult] = await Promise.all([
      db.query(usersStatsQuery),
      db.query(balancesQuery),
    ]);

    const userStats = usersStatsResult.rows[0];
    const balances = balancesResult.rows;

    // Construir objeto de respuesta con balances por moneda
    const stats = {
      usuariosActivos: parseInt(userStats.usuariosActivos) || 0,
      usuariosInactivos: parseInt(userStats.usuariosInactivos) || 0,
      balanceTotalARS: 0,
      balanceTotalUSD: 0,
      balanceTotalBRL: 0,
    };

    balances.forEach(balance => {
      const key = `balanceTotal${balance.currency}`;
      stats[key] = parseFloat(balance.total_balance) || 0;
    });

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del dashboard',
      error: error.message,
    });
  }
};

/**
 * GET /api/dashboard/chart/monthly-movement
 * Obtener datos para el gráfico de movimiento mensual
 */
const getMonthlyMovement = async (req, res) => {
  try {
    const { moneda = 'ARS', year = new Date().getFullYear() } = req.query;

    // Validar moneda
    const validCurrencies = ['ARS', 'USD', 'BRL'];
    if (!validCurrencies.includes(moneda)) {
      return res.status(400).json({
        success: false,
        message: `Moneda inválida. Debe ser una de: ${validCurrencies.join(', ')}`,
      });
    }

    const query = `
      WITH monthly_data AS (
        SELECT
          EXTRACT(MONTH FROM t.created_at) as month,
          SUM(CASE WHEN t.type IN ('deposit', 'transfer:received_ars', 'transfer:received_usd')
              THEN ABS(t.amount)
              ELSE 0
          END)::numeric / 100 as monthly_total
        FROM transactions t
        JOIN wallets w ON t.wallet_id = w.id
        WHERE w.slug = $1
          AND EXTRACT(YEAR FROM t.created_at) = $2
          AND t.confirmed = true
        GROUP BY EXTRACT(MONTH FROM t.created_at)
      )
      SELECT
        months.month,
        COALESCE(ROUND(md.monthly_total, 2), 0) as amount
      FROM (
        SELECT generate_series(1, 12) as month
      ) months
      LEFT JOIN monthly_data md ON months.month = md.month
      ORDER BY months.month
    `;

    const result = await db.query(query, [moneda, year]);

    // Mapear nombres de meses
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Construir respuesta en el formato esperado
    const labels = monthNames;
    const data = result.rows.map(row => parseFloat(row.amount));

    // Determinar el label según la moneda
    const currencyLabels = {
      ARS: 'Pesos Argentinos (ARS)',
      USD: 'Dólares (USD)',
      BRL: 'Reales (BRL)',
    };

    res.status(200).json({
      labels,
      data,
      label: currencyLabels[moneda],
    });
  } catch (error) {
    console.error('Error al obtener movimiento mensual:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimiento mensual',
      error: error.message,
    });
  }
};

/**
 * GET /api/transactions/recent
 * Obtener actividad reciente global del sistema
 */
const getRecentTransactions = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const query = `
      SELECT
        u.name as usuario,
        w.meta->>'cvu' as cvu,
        TO_CHAR(t.created_at, 'DD/MM/YYYY') as fecha,
        CASE
          WHEN t.type = 'deposit' THEN 'Depósito'
          WHEN t.type = 'withdraw' THEN 'Retiro'
          WHEN t.type LIKE 'transfer:sent%' THEN 'Transferencia Enviada'
          WHEN t.type LIKE 'transfer:received%' THEN 'Transferencia Recibida'
          WHEN t.type = 'exchange_buy' THEN 'Compra de Moneda'
          WHEN t.type = 'exchange_sell' THEN 'Venta de Moneda'
          ELSE t.type
        END as tipo,
        w.slug as moneda,
        ROUND(ABS(t.amount)::numeric / 100, 2) as monto
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      JOIN users u ON w.holder_id = u.id AND w.holder_type = 'App\\Models\\User'
      WHERE t.confirmed = true
      ORDER BY t.created_at DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);

    res.status(200).json({
      transactions: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener transacciones recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener transacciones recientes',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getMonthlyMovement,
  getRecentTransactions,
};
