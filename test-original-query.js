const db = require('./src/config/database');

async function testOriginalQuery() {
  try {
    await db.initializeConnection();

    const query = `
      SELECT
        u.name,
        u.email,
        u.cuit,
        u.cvu,
        u.created_at,
        wa.balance / 100 AS ars_balance,
        wu.balance / 100 AS usdc_balance,
        u.closed_at
      FROM users u
      LEFT JOIN LATERAL (
        SELECT w.balance
        FROM wallets w
        WHERE w.holder_id = u.id AND w.slug = 'ARS'
        LIMIT 1
      ) wa ON true
      LEFT JOIN LATERAL (
        SELECT w.balance
        FROM wallets w
        WHERE w.holder_id = u.id AND w.slug = 'USDC'
        LIMIT 1
      ) wu ON true
      WHERE u.cvu = '0000240200000000001065'
    `;

    const result = await db.query(query);
    console.log('\n📋 Resultado de la consulta ORIGINAL:');
    console.log(result.rows[0]);

    await db.closeConnections();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testOriginalQuery();
