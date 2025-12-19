const db = require('./src/config/database');

async function testDashboardStats() {
  try {
    await db.initializeConnection();

    console.log('\n🔍 EJECUTANDO LA MISMA QUERY QUE EL ENDPOINT /api/dashboard/stats\n');

    // Esta es la query EXACTA que se ejecuta en el endpoint
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

    console.log(`📊 Total de registros obtenidos: ${result.rows.length}\n`);

    // Procesar resultados: contar usuarios y sumar balances solo de activos
    const stats = {
      usuariosActivos: 0,
      usuariosInactivos: 0,
      balanceTotalARS: 0,
      balanceTotalUSD: 0,
      balanceTotalBRL: 0,
    };

    let activosConBalanceARS = 0;
    let activosConBalanceUSD = 0;
    let activosConBalanceBRL = 0;

    result.rows.forEach(row => {
      const isActive = row.closed_at === null;

      if (isActive) {
        stats.usuariosActivos += 1;
        // Solo sumar balances de usuarios activos
        const arsBalance = parseFloat(row.ars_balance) || 0;
        const usdBalance = parseFloat(row.usd_balance) || 0;
        const brlBalance = parseFloat(row.brl_balance) || 0;

        stats.balanceTotalARS += arsBalance;
        stats.balanceTotalUSD += usdBalance;
        stats.balanceTotalBRL += brlBalance;

        if (arsBalance > 0) activosConBalanceARS++;
        if (usdBalance > 0) activosConBalanceUSD++;
        if (brlBalance > 0) activosConBalanceBRL++;
      } else {
        stats.usuariosInactivos += 1;
      }
    });

    // Redondear balances a 2 decimales
    stats.balanceTotalARS = Math.round(stats.balanceTotalARS * 100) / 100;
    stats.balanceTotalUSD = Math.round(stats.balanceTotalUSD * 100) / 100;
    stats.balanceTotalBRL = Math.round(stats.balanceTotalBRL * 100) / 100;

    console.log('✅ RESULTADO FINAL (igual que el endpoint):');
    console.log(JSON.stringify(stats, null, 2));

    console.log('\n📈 DETALLES ADICIONALES:');
    console.log(`   Usuarios activos con balance ARS > 0: ${activosConBalanceARS}`);
    console.log(`   Usuarios activos con balance USD > 0: ${activosConBalanceUSD}`);
    console.log(`   Usuarios activos con balance BRL > 0: ${activosConBalanceBRL}`);

    // Mostrar algunos usuarios activos de ejemplo
    console.log('\n👥 MUESTRA DE USUARIOS ACTIVOS (primeros 10):');
    let count = 0;
    for (const row of result.rows) {
      if (row.closed_at === null && count < 10) {
        console.log(`   ARS: ${parseFloat(row.ars_balance).toFixed(2)}, USD: ${parseFloat(row.usd_balance).toFixed(2)}, BRL: ${parseFloat(row.brl_balance).toFixed(2)}`);
        count++;
      }
    }

    // Verificar con query directa
    console.log('\n🔍 VERIFICACIÓN CON QUERY DIRECTA:');
    const verifyQuery = `
      SELECT
        COUNT(*) FILTER (WHERE u.closed_at IS NULL) as activos,
        COUNT(*) FILTER (WHERE u.closed_at IS NOT NULL) as inactivos,
        ROUND(SUM(CASE WHEN u.closed_at IS NULL THEN COALESCE(wa.balance, 0) ELSE 0 END)::numeric / 100, 2) as total_ars,
        ROUND(SUM(CASE WHEN u.closed_at IS NULL THEN COALESCE(wu.balance, 0) ELSE 0 END)::numeric / 100, 2) as total_usd,
        ROUND(SUM(CASE WHEN u.closed_at IS NULL THEN COALESCE(wb.balance, 0) ELSE 0 END)::numeric / 100, 2) as total_brl
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

    const verify = await db.query(verifyQuery);
    console.log('   Verificación directa:');
    console.log(`   Activos: ${verify.rows[0].activos}`);
    console.log(`   Inactivos: ${verify.rows[0].inactivos}`);
    console.log(`   Total ARS: ${verify.rows[0].total_ars}`);
    console.log(`   Total USD: ${verify.rows[0].total_usd}`);
    console.log(`   Total BRL: ${verify.rows[0].total_brl}`);

    await db.closeConnections();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDashboardStats();
