const db = require('./src/config/database');

async function testNicolasBalance() {
  try {
    await db.initializeConnection();

    const email = 'nicolas.lopez.adm@gmail.com';

    // 1. Obtener CVU del usuario
    const userQuery = `
      SELECT id, name, email, cvu
      FROM users
      WHERE email = $1
    `;

    const userResult = await db.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
      await db.closeConnections();
      return;
    }

    const user = userResult.rows[0];
    console.log('\n👤 Usuario encontrado:');
    console.log(user);

    // 2. Balance actual de las wallets
    const walletQuery = `
      SELECT
        w.slug,
        w.balance,
        ROUND(w.balance::numeric / 100, 2) as balance_formatted
      FROM wallets w
      WHERE w.holder_id = $1
        AND w.holder_type = 'App\\Models\\User'
        AND w.slug IN ('ARS', 'USDC')
    `;

    const walletResult = await db.query(walletQuery, [user.id]);
    console.log('\n📊 Balances actuales en la tabla WALLETS:');
    walletResult.rows.forEach(row => {
      console.log(`  ${row.slug}: ${row.balance_formatted}`);
    });

    // 3. Balance calculado desde transacciones confirmadas
    const calculatedQuery = `
      SELECT
        w.slug,
        ROUND(COALESCE(SUM(t.amount), 0)::numeric / 100, 2) as balance_calculado,
        COUNT(t.id) as total_transacciones
      FROM wallets w
      LEFT JOIN transactions t ON t.wallet_id = w.id AND t.confirmed = true
      WHERE w.holder_id = $1
        AND w.holder_type = 'App\\Models\\User'
        AND w.slug IN ('ARS', 'USDC')
      GROUP BY w.slug
    `;

    const calculated = await db.query(calculatedQuery, [user.id]);
    console.log('\n🧮 Balances CALCULADOS desde transacciones confirmadas:');
    calculated.rows.forEach(row => {
      console.log(`  ${row.slug}: ${row.balance_calculado} (${row.total_transacciones} transacciones)`);
    });

    // 4. Comparación
    console.log('\n🔍 COMPARACIÓN:');
    walletResult.rows.forEach(walletRow => {
      const calc = calculated.rows.find(c => c.slug === walletRow.slug);
      const diff = parseFloat(walletRow.balance_formatted) - parseFloat(calc?.balance_calculado || 0);

      console.log(`\n  ${walletRow.slug}:`);
      console.log(`    Wallet: ${walletRow.balance_formatted}`);
      console.log(`    Calculado: ${calc?.balance_calculado || '0.00'}`);
      console.log(`    Diferencia: ${diff.toFixed(2)} ${diff === 0 ? '✅ COINCIDE' : '❌ NO COINCIDE'}`);
    });

    // 5. Últimas 5 transacciones
    const lastTransactionsQuery = `
      SELECT
        t.id,
        t.created_at,
        t.type,
        w.slug,
        ROUND(t.amount::numeric / 100, 2) as monto,
        t.confirmed
      FROM transactions t
      JOIN wallets w ON t.wallet_id = w.id
      WHERE w.holder_id = $1
        AND w.holder_type = 'App\\Models\\User'
        AND w.slug IN ('ARS', 'USDC')
      ORDER BY t.created_at DESC, t.id DESC
      LIMIT 10
    `;

    const lastTx = await db.query(lastTransactionsQuery, [user.id]);
    console.log('\n📋 Últimas 10 transacciones:');
    lastTx.rows.forEach(tx => {
      console.log(`  [${tx.id}] ${tx.created_at.toISOString()} | ${tx.slug} | ${tx.type} | ${tx.monto} | Confirmed: ${tx.confirmed}`);
    });

    await db.closeConnections();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testNicolasBalance();
