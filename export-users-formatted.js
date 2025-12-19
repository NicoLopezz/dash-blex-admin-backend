const db = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function exportUsersFormatted() {
  try {
    await db.initializeConnection();

    console.log('\n📊 EXPORTANDO USUARIOS CON BALANCES FORMATEADOS\n');

    const query = `
      SELECT
        u.id as user_id,
        u.name,
        u.email,
        u.cvu,
        CASE WHEN u.closed_at IS NULL THEN 'Activo' ELSE 'Inactivo' END as estado,
        ROUND(COALESCE(wa.balance, 0)::numeric / 100, 2) as ars_balance,
        ROUND(COALESCE(wu.balance, 0)::numeric / 100, 2) as usdc_balance,
        ROUND(COALESCE(wb.balance, 0)::numeric / 100, 2) as brl_balance,
        u.created_at,
        u.closed_at
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

    console.log(`✅ Total de usuarios activos: ${result.rows.length}\n`);

    // Crear CSV
    const csvHeader = 'user_id,name,email,cvu,estado,ars_balance,usdc_balance,brl_balance,created_at,closed_at\n';

    const csvRows = result.rows.map(row => {
      return [
        row.user_id,
        `"${row.name}"`,
        row.email,
        row.cvu || '',
        row.estado,
        row.ars_balance,
        row.usdc_balance,
        row.brl_balance,
        row.created_at ? row.created_at.toISOString() : '',
        row.closed_at ? row.closed_at.toISOString() : ''
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // Guardar archivo
    const outputPath = path.join(__dirname, 'usuarios-activos-formateados.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');

    console.log(`✅ Archivo CSV creado: ${outputPath}\n`);
    console.log('📋 PRIMEROS 10 REGISTROS:\n');

    result.rows.slice(0, 10).forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.name}`);
      console.log(`   Email: ${row.email}`);
      console.log(`   CVU: ${row.cvu || 'N/A'}`);
      console.log(`   ARS: ${row.ars_balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`   USD: ${row.usdc_balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`   BRL: ${row.brl_balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log('');
    });

    console.log('\n💡 CÓMO ABRIR EN EXCEL:');
    console.log('1. Abre Excel');
    console.log('2. Datos → Desde texto/CSV');
    console.log('3. Selecciona el archivo: usuarios-activos-formateados.csv');
    console.log('4. Origen del archivo: UTF-8');
    console.log('5. Delimitador: Coma');
    console.log('6. Los balances ya estarán formateados correctamente\n');

    await db.closeConnections();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

exportUsersFormatted();
