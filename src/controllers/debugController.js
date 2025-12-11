const db = require('../config/database');

/**
 * Debug endpoint para ver la estructura de las tablas
 */
const getTableSchema = async (req, res) => {
  try {
    const { tableName = 'users' } = req.query;

    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `;

    const result = await db.query(query, [tableName]);

    res.status(200).json({
      table: tableName,
      columns: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener esquema:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener esquema',
      error: error.message,
    });
  }
};

/**
 * Debug endpoint para ver datos de muestra
 */
const getSampleData = async (req, res) => {
  try {
    const { tableName = 'users', limit = 1 } = req.query;

    const query = `SELECT * FROM ${tableName} LIMIT $1`;
    const result = await db.query(query, [limit]);

    res.status(200).json({
      table: tableName,
      count: result.rows.length,
      sample: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener datos de muestra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos de muestra',
      error: error.message,
    });
  }
};

module.exports = {
  getTableSchema,
  getSampleData,
};
