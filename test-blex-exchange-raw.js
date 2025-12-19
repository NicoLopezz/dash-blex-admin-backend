const db = require('./src/config/database');

async function testBlexExchangeRaw() {
  try {
    await db.initializeConnection();

    console.log('\n🔍 VALOR RAW DE BLEX-EXCHANGE EN LA BASE DE DATOS\n');

    const query = `
      SELECT
        u.id,
        u.name,
        u.email,
        w.slug,
        w.balance as balance_raw,
        w.balance / 100.0 as balance_formatted,
        ROUND(w.balance::numeric / 100, 2) as balance_rounded
      FROM users u
      JOIN wallets w ON w.holder_id = u.id
        AND w.holder_type = 'App\\Models\\User'
      WHERE u.email = 'agustin.gandara@blexgroup.com'
        AND w.slug IN ('ARS', 'USDC')
      ORDER BY w.slug
    `;

    const result = await db.query(query);

    console.log('📊 VALORES DE LAS WALLETS:\n');
    result.rows.forEach(row => {
      console.log(`${row.slug}:`);
      console.log(`  Balance RAW (en centavos):     ${row.balance_raw}`);
      console.log(`  Balance formateado (÷100):     ${row.balance_formatted}`);
      console.log(`  Balance redondeado (÷100, 2d): ${row.balance_rounded}`);
      console.log('');
    });

    // Verificar tipo de dato
    const typeQuery = `
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'wallets' AND column_name = 'balance'
    `;

    const typeResult = await db.query(typeQuery);
    console.log('📋 TIPO DE DATO DE LA COLUMNA balance:');
    console.log(typeResult.rows[0]);

    await db.closeConnections();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testBlexExchangeRaw();
