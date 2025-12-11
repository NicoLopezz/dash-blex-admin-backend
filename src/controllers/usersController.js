const db = require('../config/database');

/**
 * GET /api/users
 * Obtener lista de todos los usuarios con paginación y filtros
 */
const getAllUsers = async (req, res) => {
  try {
    const {
      search = '',
      status = '',
      page = 1,
      limit = 10,
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Construir condiciones de búsqueda
    if (search) {
      whereConditions.push(`(
        u.name ILIKE $${paramIndex} OR
        u.email ILIKE $${paramIndex} OR
        u.cuit ILIKE $${paramIndex} OR
        u.cvu ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`u.account_state = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Query para obtener usuarios con sus balances
    const usersQuery = `
      SELECT
        u.id,
        u.name as nombre,
        u.cuit,
        u.email,
        u.cvu,
        u.account_state as estado,
        TO_CHAR(u.created_at, 'DD/MM/YYYY') as "fechaRegistro",
        COALESCE(
          (SELECT ROUND(w.balance::numeric / 100, 2)
           FROM wallets w
           WHERE w.holder_id = u.id
           AND w.holder_type = 'App\\Models\\User'
           AND w.slug = 'ARS'
           LIMIT 1),
          0
        ) as "balanceARS",
        COALESCE(
          (SELECT ROUND(w.balance::numeric / 100, 2)
           FROM wallets w
           WHERE w.holder_id = u.id
           AND w.holder_type = 'App\\Models\\User'
           AND w.slug = 'USD'
           LIMIT 1),
          0
        ) as "balanceUSD"
      FROM users u
      ${whereClause}
      ORDER BY u.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    // Query para contar total de usuarios
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;

    const countParams = params.slice(0, paramIndex - 1);

    const [usersResult, countResult] = await Promise.all([
      db.query(usersQuery, params),
      db.query(countQuery, countParams),
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      users: usersResult.rows,
      total,
      page: parseInt(page),
      totalPages,
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message,
    });
  }
};

/**
 * GET /api/users/:id
 * Obtener detalle completo de un usuario específico
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        u.id,
        u.name as nombre,
        u.cuit,
        u.email,
        u.cvu,
        u.account_state as estado,
        TO_CHAR(u.created_at, 'DD/MM/YYYY') as "fechaRegistro",
        COALESCE(
          (SELECT ROUND(w.balance::numeric / 100, 2)
           FROM wallets w
           WHERE w.holder_id = u.id
           AND w.holder_type = 'App\\Models\\User'
           AND w.slug = 'ARS'
           LIMIT 1),
          0
        ) as "balanceARS",
        COALESCE(
          (SELECT ROUND(w.balance::numeric / 100, 2)
           FROM wallets w
           WHERE w.holder_id = u.id
           AND w.holder_type = 'App\\Models\\User'
           AND w.slug = 'USD'
           LIMIT 1),
          0
        ) as "balanceUSD"
      FROM users u
      WHERE u.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message,
    });
  }
};

/**
 * POST /api/users
 * Crear nuevo usuario
 */
const createUser = async (req, res) => {
  try {
    const { nombre, cuit, email } = req.body;

    if (!nombre || !cuit || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, CUIT y email son requeridos',
      });
    }

    const query = `
      INSERT INTO users (name, cuit, email, account_state, created_at, updated_at)
      VALUES ($1, $2, $3, 'active', NOW(), NOW())
      RETURNING id, name as nombre, cuit, email, account_state as estado,
                TO_CHAR(created_at, 'DD/MM/YYYY') as "fechaRegistro"
    `;

    const result = await db.query(query, [nombre, cuit, email]);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'El email o CUIT ya existe',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message,
    });
  }
};

/**
 * PUT /api/users/:id
 * Actualizar datos de usuario
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, estado } = req.body;

    let updateFields = [];
    let params = [];
    let paramIndex = 1;

    if (nombre !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      params.push(nombre);
      paramIndex++;
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }

    if (estado !== undefined) {
      updateFields.push(`account_state = $${paramIndex}`);
      params.push(estado);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar',
      });
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name as nombre, cuit, email, account_state as estado,
                TO_CHAR(updated_at, 'DD/MM/YYYY') as "fechaActualizacion"
    `;

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'El email ya existe',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/users/:id
 * Desactivar usuario (soft delete)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE users
      SET account_state = 'inactive', updated_at = NOW()
      WHERE id = $1
      RETURNING id, name as nombre, account_state as estado
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usuario desactivado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar usuario',
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
