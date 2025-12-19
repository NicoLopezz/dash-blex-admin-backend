const db = require('../config/database');

/**
 * GET /api/dashboard/stats
 * Obtener estadísticas generales del sistema
 */
const getDashboardStats = async (req, res) => {
  try {
    // Usar LATERAL JOIN para obtener balances de manera eficiente
    // Esta query trae todos los usuarios con sus balances en ARS, USD y BRL
    const statsQuery = `
      SELECT
        u.closed_at,
        COALESCE(wa.balance, 0) / 100.0 AS ars_balance,
        COALESCE(wu.balance, 0) / 100.0 AS usd_balance,
        COALESCE(wb.balance, 0) / 100.0 AS brl_balance
      FROM users u
      LEFT JOIN LATERAL (
        SELECT w.balance FROM wallets w
        WHERE w.holder_id = u.id
          AND w.holder_type = 'App\\Models\\User'
          AND w.slug = 'ARS'
        LIMIT 1
      ) wa ON true
      LEFT JOIN LATERAL (
        SELECT w.balance FROM wallets w
        WHERE w.holder_id = u.id
          AND w.holder_type = 'App\\Models\\User'
          AND w.slug = 'USDC'
        LIMIT 1
      ) wu ON true
      LEFT JOIN LATERAL (
        SELECT w.balance FROM wallets w
        WHERE w.holder_id = u.id
          AND w.holder_type = 'App\\Models\\User'
          AND w.slug = 'BRL'
        LIMIT 1
      ) wb ON true
    `;

    const result = await db.query(statsQuery);

    // Procesar resultados: contar usuarios y sumar balances solo de activos
    const stats = {
      usuariosActivos: 0,
      usuariosInactivos: 0,
      balanceTotalARS: 0,
      balanceTotalUSD: 0,
      balanceTotalBRL: 0,
    };

    result.rows.forEach(row => {
      const isActive = row.closed_at === null;

      if (isActive) {
        stats.usuariosActivos += 1;
        // Solo sumar balances de usuarios activos
        stats.balanceTotalARS += parseFloat(row.ars_balance) || 0;
        stats.balanceTotalUSD += parseFloat(row.usd_balance) || 0;
        stats.balanceTotalBRL += parseFloat(row.brl_balance) || 0;
      } else {
        stats.usuariosInactivos += 1;
      }
    });

    // Redondear balances a 2 decimales
    stats.balanceTotalARS = Math.round(stats.balanceTotalARS * 100) / 100;
    stats.balanceTotalUSD = Math.round(stats.balanceTotalUSD * 100) / 100;
    stats.balanceTotalBRL = Math.round(stats.balanceTotalBRL * 100) / 100;

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
        u.cvu as cvu,
        t.created_at as fecha,
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
        ROUND(ABS(t.amount)::numeric / 100, 2) as monto,
        ROUND(COALESCE(wa.balance, 0)::numeric / 100, 2) as balance_ars,
        ROUND(COALESCE(wu.balance, 0)::numeric / 100, 2) as balance_usdc
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      JOIN users u ON w.holder_id = u.id AND w.holder_type = 'App\\Models\\User'
      LEFT JOIN LATERAL (
        SELECT balance FROM wallets
        WHERE holder_id = u.id
          AND holder_type = 'App\\Models\\User'
          AND slug = 'ARS'
        LIMIT 1
      ) wa ON true
      LEFT JOIN LATERAL (
        SELECT balance FROM wallets
        WHERE holder_id = u.id
          AND holder_type = 'App\\Models\\User'
          AND slug = 'USDC'
        LIMIT 1
      ) wu ON true
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

/**
 * GET /api/dashboard/report/all-users-transactions
 * Obtener reporte de todas las transacciones hasta la fecha para todos los usuarios
 */
const getAllUsersTransactionsReport = async (req, res) => {
  try {
    const { endDate } = req.query;

    // Si no se proporciona fecha, usar fecha actual
    const fechaLimite = endDate || new Date().toISOString().split('T')[0] + ' 23:59:59';

    const query = `
      SELECT
        u.name,
        u.email,
        u.cuit,
        u.cvu,
        u.created_at,
        u.closed_at,
        t.id as transaction_id,
        t.created_at as fecha_transaccion,
        t.type as tipo_transaccion,
        ROUND((t.amount / 100.0)::numeric, 2) as monto,
        t.confirmed,
        w.slug as moneda,
        ROUND((SUM(t.amount) OVER (
          PARTITION BY u.id, w.slug
          ORDER BY t.created_at, t.id
        ) / 100.0)::numeric, 2) as balance_acumulado
      FROM users u
      JOIN wallets w ON w.holder_id = u.id AND w.slug IN ('ARS', 'USDC')
      LEFT JOIN transactions t ON t.wallet_id = w.id
        AND t.created_at <= $1::timestamp
        AND t.confirmed = true
      ORDER BY u.cvu, w.slug, t.created_at, t.id
    `;

    const result = await db.query(query, [fechaLimite]);

    res.status(200).json({
      success: true,
      endDate: fechaLimite,
      totalRecords: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener reporte de transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reporte de transacciones',
      error: error.message,
    });
  }
};

/**
 * GET /api/dashboard/report/users-last-transaction
 * Obtener última transacción y balances actuales de cada usuario
 */
const getUsersLastTransactionReport = async (req, res) => {
  try {
    const query = `
      WITH all_user_transactions AS (
        SELECT
          u.id as user_id,
          t.id as transaction_id,
          t.created_at as fecha_ultima_transaccion,
          t.type as tipo_ultima_transaccion,
          ROUND((t.amount / 100.0)::numeric, 2) as monto_ultima_transaccion,
          w.slug as moneda_ultima_transaccion
        FROM users u
        JOIN wallets w ON w.holder_id = u.id
          AND w.holder_type = 'App\\Models\\User'
          AND w.slug IN ('ARS', 'USDC')
        JOIN transactions t ON t.wallet_id = w.id
          AND t.confirmed = true
      ),
      last_transaction_per_user AS (
        SELECT DISTINCT ON (user_id)
          user_id,
          transaction_id,
          fecha_ultima_transaccion,
          tipo_ultima_transaccion,
          monto_ultima_transaccion,
          moneda_ultima_transaccion
        FROM all_user_transactions
        ORDER BY user_id, fecha_ultima_transaccion DESC, transaction_id DESC
      )
      SELECT
        u.name,
        u.email,
        u.cuit,
        u.cvu,
        u.created_at,
        u.closed_at,
        lt.transaction_id,
        lt.fecha_ultima_transaccion,
        lt.tipo_ultima_transaccion,
        lt.monto_ultima_transaccion,
        lt.moneda_ultima_transaccion,
        ROUND(COALESCE(wa.balance, 0)::numeric / 100, 2) as balance_ars,
        ROUND(COALESCE(wu.balance, 0)::numeric / 100, 2) as balance_usdc
      FROM users u
      LEFT JOIN last_transaction_per_user lt ON lt.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT balance FROM wallets
        WHERE holder_id = u.id
          AND holder_type = 'App\\Models\\User'
          AND slug = 'ARS'
        LIMIT 1
      ) wa ON true
      LEFT JOIN LATERAL (
        SELECT balance FROM wallets
        WHERE holder_id = u.id
          AND holder_type = 'App\\Models\\User'
          AND slug = 'USDC'
        LIMIT 1
      ) wu ON true
      ORDER BY u.cvu
    `;

    const result = await db.query(query);

    res.status(200).json({
      success: true,
      totalUsers: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener reporte de última transacción por usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reporte de última transacción por usuario',
      error: error.message,
    });
  }
};

/**
 * GET /api/dashboard/report/user-transactions/:cvu
 * Obtener todas las transacciones con balance acumulado de un usuario específico por CVU
 * Paginado: máximo 50 transacciones por página
 */
const getUserTransactionsByCVU = async (req, res) => {
  try {
    const { cvu } = req.params;
    const { endDate, page = 1, limit = 50 } = req.query;

    // Validar que se proporcione el CVU
    if (!cvu) {
      return res.status(400).json({
        success: false,
        message: 'El CVU es requerido',
      });
    }

    // Validar y sanitizar parámetros de paginación
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    // Si no se proporciona fecha, usar fecha actual
    const fechaLimite = endDate || new Date().toISOString().split('T')[0] + ' 23:59:59';

    // Primero obtener el total de transacciones para calcular páginas
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      JOIN wallets w ON w.holder_id = u.id AND w.slug IN ('ARS', 'USDC')
      LEFT JOIN transactions t ON t.wallet_id = w.id
        AND t.created_at <= $1::timestamp
        AND t.confirmed = true
      WHERE u.cvu = $2
    `;

    const countResult = await db.query(countQuery, [fechaLimite, cvu]);
    const totalRecords = parseInt(countResult.rows[0].total);

    // Query principal con paginación
    const query = `
      WITH all_transactions AS (
        SELECT
          u.id as user_id,
          u.name,
          u.email,
          u.cuit,
          u.cvu,
          u.created_at,
          u.closed_at,
          t.id as transaction_id,
          t.created_at as fecha_transaccion,
          t.type as tipo_transaccion,
          t.amount,
          t.confirmed,
          w.slug as moneda
        FROM users u
        JOIN wallets w ON w.holder_id = u.id AND w.slug IN ('ARS', 'USDC')
        LEFT JOIN transactions t ON t.wallet_id = w.id
          AND t.created_at <= $1::timestamp
          AND t.confirmed = true
        WHERE u.cvu = $2
      ),
      balance_calculations AS (
        SELECT
          *,
          ROUND((SUM(CASE WHEN moneda = 'ARS' THEN amount ELSE 0 END) OVER (
            PARTITION BY user_id
            ORDER BY fecha_transaccion, transaction_id
          ) / 100.0)::numeric, 2) as balance_acumulado_ars,
          ROUND((SUM(CASE WHEN moneda = 'USDC' THEN amount ELSE 0 END) OVER (
            PARTITION BY user_id
            ORDER BY fecha_transaccion, transaction_id
          ) / 100.0)::numeric, 2) as balance_acumulado_usdc
        FROM all_transactions
      )
      SELECT
        name,
        email,
        cuit,
        cvu,
        created_at,
        closed_at,
        transaction_id,
        fecha_transaccion,
        tipo_transaccion,
        ROUND((amount / 100.0)::numeric, 2) as monto,
        confirmed,
        moneda,
        balance_acumulado_ars,
        balance_acumulado_usdc
      FROM balance_calculations
      WHERE transaction_id IS NOT NULL
      ORDER BY fecha_transaccion DESC, transaction_id DESC
      LIMIT $3 OFFSET $4
    `;

    const result = await db.query(query, [fechaLimite, cvu, limitNum, offset]);

    // Verificar si el usuario existe
    if (totalRecords === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado con el CVU proporcionado',
      });
    }

    const totalPages = Math.ceil(totalRecords / limitNum);

    res.status(200).json({
      success: true,
      cvu: cvu,
      endDate: fechaLimite,
      pagination: {
        currentPage: pageNum,
        limit: limitNum,
        totalRecords: totalRecords,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener transacciones del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener transacciones del usuario',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getMonthlyMovement,
  getRecentTransactions,
  getAllUsersTransactionsReport,
  getUsersLastTransactionReport,
  getUserTransactionsByCVU,
};
