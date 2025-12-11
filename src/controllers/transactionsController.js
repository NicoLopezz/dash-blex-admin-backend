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
 * GET /api/users/:userId/transactions
 * Obtener todas las transacciones de un usuario específico con paginación normal
 */
const getUserTransactionsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      tipo,
      moneda,
    } = req.query;

    const offset = (page - 1) * limit;

    let whereConditions = ['u.id = $1'];
    let params = [userId];
    let paramIndex = 2;

    if (startDate) {
      whereConditions.push(`t.created_at >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`t.created_at <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    if (tipo) {
      whereConditions.push(`t.type = $${paramIndex}`);
      params.push(tipo);
      paramIndex++;
    }

    if (moneda) {
      whereConditions.push(`w.slug = $${paramIndex}`);
      params.push(moneda);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Query para obtener las transacciones
    const transactionsQuery = `
      SELECT
        t.id,
        t.created_at as fecha,
        t.type as tipo,
        w.slug as moneda,
        ROUND(t.amount::numeric / 100, 2) as monto,
        t.confirmed as confirmado
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      JOIN users u ON w.holder_id = u.id AND w.holder_type = 'App\\Models\\User'
      WHERE ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    // Query para contar el total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      JOIN users u ON w.holder_id = u.id AND w.holder_type = 'App\\Models\\User'
      WHERE ${whereClause}
    `;

    const countParams = params.slice(0, paramIndex - 1);

    const [transactionsResult, countResult] = await Promise.all([
      db.query(transactionsQuery, params),
      db.query(countQuery, countParams),
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.status(200).json({
      transactions: transactionsResult.rows,
      total,
      page: parseInt(page),
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

/**
 * GET /api/users/:userId/transactions/incremental
 * CURSOR-BASED PAGINATION - Cargar solo lo nuevo desde la última consulta
 *
 * Parámetros:
 * - cursor: ID o timestamp de la última transacción vista
 * - limit: cantidad de resultados (default 20)
 * - direction: 'newer' (más recientes) o 'older' (más antiguas)
 */
const getUserTransactionsIncremental = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      cursor, // Puede ser ID de transacción o timestamp ISO
      limit = 20,
      direction = 'older', // 'newer' para cargar nuevas, 'older' para cargar anteriores
      moneda,
      tipo,
    } = req.query;

    let whereConditions = ['u.id = $1'];
    let params = [userId];
    let paramIndex = 2;

    // Filtro por moneda
    if (moneda) {
      whereConditions.push(`w.slug = $${paramIndex}`);
      params.push(moneda);
      paramIndex++;
    }

    // Filtro por tipo
    if (tipo) {
      whereConditions.push(`t.type = $${paramIndex}`);
      params.push(tipo);
      paramIndex++;
    }

    // CURSOR: Cargar solo desde/hasta cierto punto
    if (cursor) {
      // Intentar parsear como timestamp ISO primero, si falla usar como ID
      const isTimestamp = cursor.includes('T') || cursor.includes('-');

      if (isTimestamp) {
        // Usar timestamp como cursor
        if (direction === 'newer') {
          whereConditions.push(`t.created_at > $${paramIndex}`);
        } else {
          whereConditions.push(`t.created_at < $${paramIndex}`);
        }
        params.push(cursor);
      } else {
        // Usar ID como cursor
        if (direction === 'newer') {
          whereConditions.push(`t.id > $${paramIndex}`);
        } else {
          whereConditions.push(`t.id < $${paramIndex}`);
        }
        params.push(parseInt(cursor));
      }
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Determinar orden según dirección
    const orderDirection = direction === 'newer' ? 'ASC' : 'DESC';

    const query = `
      SELECT
        t.id,
        t.created_at as fecha,
        t.type as tipo,
        w.slug as moneda,
        ROUND(t.amount::numeric / 100, 2) as monto,
        t.confirmed as confirmado
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      JOIN users u ON w.holder_id = u.id AND w.holder_type = 'App\\Models\\User'
      WHERE ${whereClause}
      ORDER BY t.created_at ${orderDirection}, t.id ${orderDirection}
      LIMIT $${paramIndex}
    `;

    params.push(parseInt(limit));

    const result = await db.query(query, params);

    // Si buscamos "newer", invertir resultados para que estén en orden DESC
    const transactions = direction === 'newer'
      ? result.rows.reverse()
      : result.rows;

    // Calcular cursores para la próxima página
    let nextCursor = null;
    let prevCursor = null;

    if (transactions.length > 0) {
      // Cursor para cargar transacciones más antiguas
      nextCursor = transactions[transactions.length - 1].fecha;
      // Cursor para cargar transacciones más nuevas
      prevCursor = transactions[0].fecha;
    }

    res.status(200).json({
      transactions,
      count: transactions.length,
      hasMore: transactions.length === parseInt(limit),
      cursors: {
        next: nextCursor,  // Para cargar más antiguas
        prev: prevCursor,  // Para cargar más nuevas
      },
    });
  } catch (error) {
    console.error('Error al obtener transacciones incrementales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener transacciones incrementales',
      error: error.message,
    });
  }
};

/**
 * GET /api/users/:userId/transactions/since
 * POLLING ENDPOINT - Obtener solo transacciones nuevas desde un timestamp
 *
 * Útil para actualizaciones en tiempo real sin WebSockets
 */
const getNewTransactionsSince = async (req, res) => {
  try {
    const { userId } = req.params;
    const { since, moneda } = req.query;

    if (!since) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro "since" (timestamp ISO) es requerido',
      });
    }

    let whereConditions = [
      'u.id = $1',
      't.created_at > $2',
    ];
    let params = [userId, since];
    let paramIndex = 3;

    if (moneda) {
      whereConditions.push(`w.slug = $${paramIndex}`);
      params.push(moneda);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT
        t.id,
        t.created_at as fecha,
        t.type as tipo,
        w.slug as moneda,
        ROUND(t.amount::numeric / 100, 2) as monto,
        t.confirmed as confirmado
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      JOIN users u ON w.holder_id = u.id AND w.holder_type = 'App\\Models\\User'
      WHERE ${whereClause}
      ORDER BY t.created_at ASC
    `;

    const result = await db.query(query, params);

    res.status(200).json({
      newTransactions: result.rows,
      count: result.rows.length,
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error al obtener nuevas transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener nuevas transacciones',
      error: error.message,
    });
  }
};

/**
 * POST /api/transactions
 * Crear nueva transacción
 */
const createTransaction = async (req, res) => {
  try {
    const { userId, tipo, moneda, monto, descripcion } = req.body;

    if (!userId || !tipo || !moneda || monto === undefined) {
      return res.status(400).json({
        success: false,
        message: 'userId, tipo, moneda y monto son requeridos',
      });
    }

    // Obtener el wallet del usuario para la moneda especificada
    const walletQuery = `
      SELECT id FROM wallets
      WHERE holder_id = $1
        AND holder_type = 'App\\Models\\User'
        AND slug = $2
      LIMIT 1
    `;

    const walletResult = await db.query(walletQuery, [userId, moneda]);

    if (walletResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró wallet para la moneda ${moneda}`,
      });
    }

    const walletId = walletResult.rows[0].id;

    // Convertir monto a centavos
    const amountInCents = Math.round(parseFloat(monto) * 100);

    // Crear la transacción
    const insertQuery = `
      INSERT INTO transactions (
        wallet_id,
        type,
        amount,
        confirmed,
        meta,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, true, $4, NOW(), NOW())
      RETURNING
        id,
        created_at as fecha,
        type as tipo,
        ROUND(amount::numeric / 100, 2) as monto,
        confirmed as confirmado
    `;

    const meta = descripcion ? JSON.stringify({ description: descripcion }) : '{}';

    const result = await db.query(insertQuery, [
      walletId,
      tipo,
      amountInCents,
      meta,
    ]);

    // Actualizar el balance del wallet
    const updateBalanceQuery = `
      UPDATE wallets
      SET balance = balance + $1, updated_at = NOW()
      WHERE id = $2
    `;

    await db.query(updateBalanceQuery, [amountInCents, walletId]);

    res.status(201).json({
      success: true,
      message: 'Transacción creada exitosamente',
      data: {
        ...result.rows[0],
        moneda,
      },
    });
  } catch (error) {
    console.error('Error al crear transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear transacción',
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
  getUserTransactionsByUserId,
  getUserTransactionsIncremental,
  getNewTransactionsSince,
  createTransaction,
  getTransactionsSummary,
  getTransactionsByCurrency,
};
