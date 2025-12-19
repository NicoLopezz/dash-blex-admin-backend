const db = require('./src/config/database');

async function checkAllUsersSync() {
  try {
    await db.initializeConnection();

    const query = `
      WITH wallet_balances AS (
        SELECT
          u.id,
          u.name,
          u.email,
          u.cvu,
          w.slug,
          ROUND(w.balance::numeric / 100, 2) as wallet_balance
        FROM users u
        JOIN wallets w ON w.holder_id = u.id
          AND w.holder_type = 'App\\Models\\User'
          AND w.slug IN ('ARS', 'USDC')
      ),
      calculated_balances AS (
        SELECT
          u.id,
          w.slug,
          ROUND(COALESCE(SUM(t.amount), 0)::numeric / 100, 2) as calculated_balance
        FROM users u
        JOIN wallets w ON w.holder_id = u.id
          AND w.holder_type = 'App\\Models\\User'
          AND w.slug IN ('ARS', 'USDC')
        LEFT JOIN transactions t ON t.wallet_id = w.id AND t.confirmed = true
        GROUP BY u.id, w.slug
      )
      SELECT
        wb.name,
        wb.email,
        wb.cvu,
        wb.slug,
        wb.wallet_balance,
        cb.calculated_balance,
        ROUND(wb.wallet_balance - cb.calculated_balance, 2) as diferencia
      FROM wallet_balances wb
      JOIN calculated_balances cb ON wb.id = cb.id AND wb.slug = cb.slug
      WHERE ROUND(wb.wallet_balance - cb.calculated_balance, 2) != 0
      ORDER BY ABS(wb.wallet_balance - cb.calculated_balance) DESC
      LIMIT 20
    `;

    const result = await db.query(query);

    console.log('\n🔍 USUARIOS CON DESINCRONIZACIÓN (Top 20 por diferencia):');
    console.log(`Total encontrados: ${result.rows.length}\n`);

    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.name} (${row.email})`);
      console.log(`   CVU: ${row.cvu}`);
      console.log(`   Moneda: ${row.slug}`);
      console.log(`   Wallet: ${row.wallet_balance}`);
      console.log(`   Calculado: ${row.calculated_balance}`);
      console.log(`   Diferencia: ${row.diferencia} ❌\n`);
    });

    // Contar total de usuarios con desincronización
    const countQuery = `
      WITH wallet_balances AS (
        SELECT
          u.id,
          w.slug,
          ROUND(w.balance::numeric / 100, 2) as wallet_balance
        FROM users u
        JOIN wallets w ON w.holder_id = u.id
          AND w.holder_type = 'App\\Models\\User'
          AND w.slug IN ('ARS', 'USDC')
      ),
      calculated_balances AS (
        SELECT
          u.id,
          w.slug,
          ROUND(COALESCE(SUM(t.amount), 0)::numeric / 100, 2) as calculated_balance
        FROM users u
        JOIN wallets w ON w.holder_id = u.id
          AND w.holder_type = 'App\\Models\\User'
          AND w.slug IN ('ARS', 'USDC')
        LEFT JOIN transactions t ON t.wallet_id = w.id AND t.confirmed = true
        GROUP BY u.id, w.slug
      )
      SELECT COUNT(DISTINCT wb.id) as total_usuarios_desincronizados
      FROM wallet_balances wb
      JOIN calculated_balances cb ON wb.id = cb.id AND wb.slug = cb.slug
      WHERE ROUND(wb.wallet_balance - cb.calculated_balance, 2) != 0
    `;

    const countResult = await db.query(countQuery);
    console.log(`\n📊 RESUMEN:`);
    console.log(`Total de usuarios con desincronización: ${countResult.rows[0].total_usuarios_desincronizados}`);

    await db.closeConnections();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllUsersSync();
