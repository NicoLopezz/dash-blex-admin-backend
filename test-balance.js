const db = require('./src/config/database');

async function testBalance() {
  try {
    await db.initializeConnection();

    const cvu = '0000240200000000001065';

    // 1. Balance actual de la wallet
    const walletQuery = `
      SELECT
        w.slug,
        w.balance,
        ROUND(w.balance::numeric / 100, 2) as balance_formatted
      FROM users u
      JOIN wallets w ON w.holder_id = u.id
        AND w.holder_type = 'App\\Models\\User'
        AND w.slug = 'ARS'
      WHERE u.cvu = $1
    `;

    const walletResult = await db.query(walletQuery, [cvu]);
    console.log('\n📊 Balance actual de la wallet:');
    console.log(walletResult.rows[0]);

    // 2. Última transacción confirmada
    const lastConfirmedQuery = `
      SELECT
        t.id,
        t.created_at,
        t.type,
        ROUND(t.amount::numeric / 100, 2) as monto,
        t.confirmed
      FROM users u
      JOIN wallets w ON w.holder_id = u.id AND w.slug = 'ARS'
      JOIN transactions t ON t.wallet_id = w.id
      WHERE u.cvu = $1 AND t.confirmed = true
      ORDER BY t.created_at DESC, t.id DESC
      LIMIT 1
    `;

    const lastConfirmed = await db.query(lastConfirmedQuery, [cvu]);
    console.log('\n✅ Última transacción CONFIRMADA:');
    console.log(lastConfirmed.rows[0]);

    // 3. Balance calculado hasta la última transacción confirmada
    const calculatedQuery = `
      SELECT
        ROUND(SUM(t.amount)::numeric / 100, 2) as balance_calculado
      FROM users u
      JOIN wallets w ON w.holder_id = u.id AND w.slug = 'ARS'
      JOIN transactions t ON t.wallet_id = w.id
      WHERE u.cvu = $1 AND t.confirmed = true
    `;

    const calculated = await db.query(calculatedQuery, [cvu]);
    console.log('\n🧮 Balance CALCULADO (suma de todas las transacciones confirmadas):');
    console.log(calculated.rows[0]);

    // 4. ¿Hay transacciones NO confirmadas?
    const unconfirmedQuery = `
      SELECT
        COUNT(*) as total_no_confirmadas,
        ROUND(COALESCE(SUM(t.amount), 0)::numeric / 100, 2) as suma_no_confirmadas
      FROM users u
      JOIN wallets w ON w.holder_id = u.id AND w.slug = 'ARS'
      JOIN transactions t ON t.wallet_id = w.id
      WHERE u.cvu = $1 AND t.confirmed = false
    `;

    const unconfirmed = await db.query(unconfirmedQuery, [cvu]);
    console.log('\n❌ Transacciones NO CONFIRMADAS:');
    console.log(unconfirmed.rows[0]);

    // 5. ¿Hay transacciones posteriores a 2025-12-13?
    const futureQuery = `
      SELECT
        COUNT(*) as total_posteriores,
        ROUND(COALESCE(SUM(t.amount), 0)::numeric / 100, 2) as suma_posteriores
      FROM users u
      JOIN wallets w ON w.holder_id = u.id AND w.slug = 'ARS'
      JOIN transactions t ON t.wallet_id = w.id
      WHERE u.cvu = $1
        AND t.created_at > '2025-12-13 01:58:42'
        AND t.confirmed = true
    `;

    const future = await db.query(futureQuery, [cvu]);
    console.log('\n⏭️  Transacciones POSTERIORES a 2025-12-13 01:58:42:');
    console.log(future.rows[0]);

    await db.closeConnections();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testBalance();
