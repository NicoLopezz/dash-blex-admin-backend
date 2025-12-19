const db = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function exportAllUsersFormatted() {
  try {
    await db.initializeConnection();

    console.log('\n📊 EXPORTANDO TODOS LOS USUARIOS CON BALANCES FORMATEADOS\n');

    const query = `
      SELECT
        u.id as user_id,
        u.name,
        u.email,
        u.account_state,
        u.closed_at,
        CASE WHEN u.closed_at IS NULL THEN 'Activo' ELSE 'Cerrado' END as estado,
        ROUND(COALESCE(wa.balance, 0)::numeric / 100, 2) AS ars_balance,
        ROUND(COALESCE(wu.balance, 0)::numeric / 100, 2) AS usdc_balance,
        ROUND(COALESCE(wb.balance, 0)::numeric / 100, 2) AS brl_balance,
        u.created_at
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
      ORDER BY u.created_at DESC
    `;

    console.log('⏳ Ejecutando query...\n');
    const result = await db.query(query);

    console.log(`✅ Total de usuarios: ${result.rows.length}`);
    console.log(`   - Activos: ${result.rows.filter(r => r.estado === 'Activo').length}`);
    console.log(`   - Cerrados: ${result.rows.filter(r => r.estado === 'Cerrado').length}\n`);

    // Crear CSV
    const csvHeader = 'user_id,name,email,account_state,closed_at,estado,ars_balance,usdc_balance,brl_balance,created_at\n';

    const csvRows = result.rows.map(row => {
      return [
        row.user_id,
        `"${(row.name || '').replace(/"/g, '""')}"`, // Escapar comillas dobles
        row.email || '',
        row.account_state || '',
        row.closed_at ? row.closed_at.toISOString() : '',
        row.estado,
        row.ars_balance,
        row.usdc_balance,
        row.brl_balance,
        row.created_at ? row.created_at.toISOString() : ''
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // Guardar archivo
    const outputPath = path.join(__dirname, 'todos-usuarios-formateados.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');

    console.log(`✅ Archivo CSV creado: ${outputPath}\n`);

    // Mostrar primeros 10 usuarios
    console.log('📋 PRIMEROS 10 USUARIOS (ordenados por fecha de creación DESC):\n');

    result.rows.slice(0, 10).forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.name || 'SIN NOMBRE'}`);
      console.log(`   ID: ${row.user_id} | Email: ${row.email || 'N/A'}`);
      console.log(`   Estado: ${row.estado} | Account State: ${row.account_state || 'N/A'}`);
      console.log(`   ARS: ${row.ars_balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`   USD: ${row.usdc_balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`   BRL: ${row.brl_balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`   Creado: ${row.created_at ? row.created_at.toISOString().substring(0, 10) : 'N/A'}`);
      console.log('');
    });

    // Calcular totales
    let totalARS = 0;
    let totalUSD = 0;
    let totalBRL = 0;
    let totalARSActivos = 0;
    let totalUSDActivos = 0;
    let totalBRLActivos = 0;

    result.rows.forEach(row => {
      totalARS += parseFloat(row.ars_balance) || 0;
      totalUSD += parseFloat(row.usdc_balance) || 0;
      totalBRL += parseFloat(row.brl_balance) || 0;

      if (row.estado === 'Activo') {
        totalARSActivos += parseFloat(row.ars_balance) || 0;
        totalUSDActivos += parseFloat(row.usdc_balance) || 0;
        totalBRLActivos += parseFloat(row.brl_balance) || 0;
      }
    });

    console.log('\n💰 TOTALES DE TODOS LOS USUARIOS:');
    console.log(`   ARS: ${totalARS.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`   USD: ${totalUSD.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`   BRL: ${totalBRL.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    console.log('\n💰 TOTALES SOLO USUARIOS ACTIVOS:');
    console.log(`   ARS: ${totalARSActivos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`   USD: ${totalUSDActivos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`   BRL: ${totalBRLActivos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    console.log('\n💡 CÓMO ABRIR EN EXCEL:');
    console.log('1. Abre Excel');
    console.log('2. Datos → Desde texto/CSV');
    console.log('3. Selecciona el archivo: todos-usuarios-formateados.csv');
    console.log('4. Origen del archivo: UTF-8');
    console.log('5. Delimitador: Coma');
    console.log('6. Los balances ya estarán formateados correctamente (divididos por 100)\n');

    console.log('✅ Los valores están en formato decimal correcto:');
    console.log('   - NO verás: 2941132060000000000');
    console.log('   - SÍ verás: 2941132.06\n');

    await db.closeConnections();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

exportAllUsersFormatted();
