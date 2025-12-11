const { Pool } = require('pg');
const { createTunnel } = require('tunnel-ssh');
const fs = require('fs');
require('dotenv').config();

let pool;
let sshClient;

/**
 * Configuración del túnel SSH
 */
const sshConfig = {
  host: process.env.SSH_HOST,
  port: parseInt(process.env.SSH_PORT) || 22,
  username: process.env.SSH_USER,
  privateKey: fs.existsSync(process.env.SSH_PRIVATE_KEY_PATH || '')
    ? fs.readFileSync(process.env.SSH_PRIVATE_KEY_PATH)
    : undefined,
};

/**
 * Configuración del destino (PostgreSQL)
 */
const forwardConfig = {
  srcAddr: '127.0.0.1',
  srcPort: 0, // Puerto local aleatorio
  dstAddr: process.env.DB_HOST,
  dstPort: parseInt(process.env.DB_PORT) || 5432,
};

/**
 * Inicializar conexión con o sin túnel SSH
 */
const initializeConnection = async () => {
  try {
    const useSSH = process.env.USE_SSH_TUNNEL === 'true';

    if (useSSH) {
      console.log('🔐 Estableciendo túnel SSH...');

      // Crear túnel SSH
      const [server, client] = await createTunnel(
        { autoClose: false },
        { port: forwardConfig.srcPort },
        sshConfig,
        forwardConfig
      );

      sshClient = client;
      const tunnelPort = server.address().port;

      console.log(`✅ Túnel SSH establecido en puerto local ${tunnelPort}`);

      // Configurar pool de PostgreSQL usando el túnel
      pool = new Pool({
        host: '127.0.0.1',
        port: tunnelPort,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        ssl: false, // No necesario con túnel SSH
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        statement_timeout: 30000,
      });
    } else {
      console.log('📡 Conectando directamente a PostgreSQL...');

      // Conexión directa sin túnel SSH
      pool = new Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        ssl: {
          rejectUnauthorized: false,
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        statement_timeout: 30000,
      });
    }

    // Event listeners
    pool.on('connect', () => {
      console.log('✅ Nueva conexión establecida con PostgreSQL');
    });

    pool.on('error', (err) => {
      console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
    });

    return pool;
  } catch (error) {
    console.error('❌ Error al inicializar conexión:', error.message);
    throw error;
  }
};

/**
 * Función para verificar la conexión
 */
const testConnection = async () => {
  try {
    if (!pool) {
      await initializeConnection();
    }

    const client = await pool.connect();
    const result = await client.query('SELECT NOW(), current_database(), current_user');
    console.log('✅ Conexión exitosa a PostgreSQL');
    console.log(`   📅 Timestamp: ${result.rows[0].now}`);
    console.log(`   🗄️  Database: ${result.rows[0].current_database}`);
    console.log(`   👤 User: ${result.rows[0].current_user}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:', error.message);
    return false;
  }
};

/**
 * Cerrar conexiones
 */
const closeConnections = async () => {
  try {
    if (pool) {
      await pool.end();
      console.log('✅ Pool de PostgreSQL cerrado');
    }
    if (sshClient) {
      sshClient.end();
      console.log('✅ Túnel SSH cerrado');
    }
  } catch (error) {
    console.error('❌ Error al cerrar conexiones:', error.message);
  }
};

module.exports = {
  initializeConnection,
  testConnection,
  closeConnections,
  getPool: () => pool,
  query: (text, params) => pool.query(text, params),
};
