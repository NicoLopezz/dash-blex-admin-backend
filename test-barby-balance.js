const db = require('./src/config/database');

async function testBarbyBalance() {
  try {
    await db.initializeConnection();

    const email = 'contacto@blexgroup.com';

    // 1. Obtener datos del usuario
    const userQuery = `
      SELECT id, name, email, cvu, created_at, closed_at
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
    console.log('\n👤 USUARIO:');
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   CVU: ${user.cvu}`);
    console.log(`   Creado: ${user.created_at}`);
    console.log(`   Cerrado: ${user.closed_at || 'Activo'}`);

    // 2. Balance actual de las wallets (tabla wallets)
    const walletQuery = `
      SELECT
        w.slug,
        w.balance,
        ROUND(w.balance::numeric / 100, 2) as balance_formatted
      FROM wallets w
      WHERE w.holder_id = $1
        AND w.holder_type = 'App\\Models\\User'
        AND w.slug IN ('ARS', 'USDC', 'BRL')
      ORDER BY w.slug
    `;

    const walletResult = await db.query(walletQuery, [user.id]);
    console.log('\n📊 BALANCES ACTUALES (Tabla WALLETS):');
    walletResult.rows.forEach(row => {
      console.log(`   ${row.slug}: ${row.balance_formatted}`);
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
        AND w.slug IN ('ARS', 'USDC', 'BRL')
      GROUP BY w.slug
      ORDER BY w.slug
    `;

    const calculated = await db.query(calculatedQuery, [user.id]);
    console.log('\n🧮 BALANCES CALCULADOS (Desde transacciones confirmadas):');
    calculated.rows.forEach(row => {
      console.log(`   ${row.slug}: ${row.balance_calculado} (${row.total_transacciones} transacciones)`);
    });

    // 4. Comparación
    console.log('\n🔍 COMPARACIÓN:');
    walletResult.rows.forEach(walletRow => {
      const calc = calculated.rows.find(c => c.slug === walletRow.slug);
      const diff = parseFloat(walletRow.balance_formatted) - parseFloat(calc?.balance_calculado || 0);

      console.log(`\n   ${walletRow.slug}:`);
      console.log(`     Wallet:    ${walletRow.balance_formatted}`);
      console.log(`     Calculado: ${calc?.balance_calculado || '0.00'}`);
      console.log(`     Diferencia: ${diff.toFixed(2)} ${Math.abs(diff) < 0.01 ? '✅ COINCIDE' : '❌ NO COINCIDE'}`);
    });

    // 5. Últimas 50 transacciones confirmadas
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
        AND t.confirmed = true
      ORDER BY t.created_at DESC, t.id DESC
      LIMIT 50
    `;

    const lastTx = await db.query(lastTransactionsQuery, [user.id]);
    console.log('\n📋 ÚLTIMAS 50 TRANSACCIONES CONFIRMADAS:');
    if (lastTx.rows.length > 0) {
      lastTx.rows.forEach(tx => {
        const confirmedIcon = tx.confirmed ? '✅' : '❌';
        console.log(`   [${tx.id}] ${tx.created_at.toISOString().substring(0, 19)} | ${tx.slug.padEnd(4)} | ${tx.type.padEnd(20)} | ${String(tx.monto).padStart(10)} | ${confirmedIcon}`);
      });
    } else {
      console.log('   No hay transacciones');
    }

    // 6. Total de transacciones por moneda
    const totalTxQuery = `
      SELECT
        w.slug,
        COUNT(t.id) as total_confirmadas,
        COUNT(CASE WHEN t.confirmed = false THEN 1 END) as total_no_confirmadas
      FROM wallets w
      LEFT JOIN transactions t ON t.wallet_id = w.id
      WHERE w.holder_id = $1
        AND w.holder_type = 'App\\Models\\User'
        AND w.slug IN ('ARS', 'USDC', 'BRL')
      GROUP BY w.slug
      ORDER BY w.slug
    `;

    const totalTx = await db.query(totalTxQuery, [user.id]);
    console.log('\n📈 RESUMEN DE TRANSACCIONES:');
    totalTx.rows.forEach(row => {
      console.log(`   ${row.slug}: ${row.total_confirmadas} confirmadas, ${row.total_no_confirmadas} sin confirmar`);
    });

    await db.closeConnections();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testBarbyBalance();
