const db = require('./src/config/database');

async function testActiveUsersDetail() {
  try {
    await db.initializeConnection();

    console.log('\n🔍 LISTADO COMPLETO DE USUARIOS ACTIVOS CON SUS BALANCES\n');

    const query = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.cvu,
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
      WHERE u.closed_at IS NULL
      ORDER BY u.name
    `;

    const result = await db.query(query);

    console.log(`📊 Total de usuarios activos encontrados: ${result.rows.length}\n`);
    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════\n');

    let totalARS = 0;
    let totalUSD = 0;
    let totalBRL = 0;

    result.rows.forEach((user, idx) => {
      const arsBalance = parseFloat(user.ars_balance);
      const usdBalance = parseFloat(user.usd_balance);
      const brlBalance = parseFloat(user.brl_balance);

      totalARS += arsBalance;
      totalUSD += usdBalance;
      totalBRL += brlBalance;

      console.log(`${(idx + 1).toString().padStart(2)}. ${user.name}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    CVU: ${user.cvu}`);
      console.log(`    ID: ${user.id}`);
      console.log(`    Balance ARS:  ${arsBalance.toFixed(2).padStart(15)}`);
      console.log(`    Balance USD:  ${usdBalance.toFixed(2).padStart(15)}`);
      console.log(`    Balance BRL:  ${brlBalance.toFixed(2).padStart(15)}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
    console.log('\n💰 TOTALES:');
    console.log(`    Total ARS: ${totalARS.toFixed(2)}`);
    console.log(`    Total USD: ${totalUSD.toFixed(2)}`);
    console.log(`    Total BRL: ${totalBRL.toFixed(2)}`);

    // Redondear como en el código del dashboard
    const totalARSRounded = Math.round(totalARS * 100) / 100;
    const totalUSDRounded = Math.round(totalUSD * 100) / 100;
    const totalBRLRounded = Math.round(totalBRL * 100) / 100;

    console.log('\n💰 TOTALES REDONDEADOS (como en el dashboard):');
    console.log(`    Total ARS: ${totalARSRounded}`);
    console.log(`    Total USD: ${totalUSDRounded}`);
    console.log(`    Total BRL: ${totalBRLRounded}`);

    console.log('\n✅ VERIFICACIÓN:');
    console.log(`    ¿Total ARS coincide con dashboard (4617747.46)? ${totalARSRounded === 4617747.46 ? '✅ SÍ' : '❌ NO - Diferencia: ' + (totalARSRounded - 4617747.46).toFixed(2)}`);
    console.log(`    ¿Total USD coincide con dashboard (389475.35)? ${totalUSDRounded === 389475.35 ? '✅ SÍ' : '❌ NO - Diferencia: ' + (totalUSDRounded - 389475.35).toFixed(2)}`);
    console.log(`    ¿Total BRL coincide con dashboard (0)? ${totalBRLRounded === 0 ? '✅ SÍ' : '❌ NO - Diferencia: ' + totalBRLRounded.toFixed(2)}`);

    await db.closeConnections();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testActiveUsersDetail();
