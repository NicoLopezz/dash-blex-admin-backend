const db = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function exportAllUsersForExcel() {
  try {
    await db.initializeConnection();

    console.log('\n📊 EXPORTANDO PARA EXCEL CON FORMATO NUMÉRICO\n');

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

    console.log(`✅ Total de usuarios: ${result.rows.length}\n`);

    // Crear CSV con punto y coma como separador (formato Excel europeo)
    const csvHeader = 'user_id;name;email;account_state;closed_at;estado;ars_balance;usdc_balance;brl_balance;created_at\n';

    const csvRows = result.rows.map(row => {
      return [
        row.user_id,
        `"${(row.name || '').replace(/"/g, '""')}"`,
        row.email || '',
        row.account_state || '',
        row.closed_at ? row.closed_at.toISOString() : '',
        row.estado,
        row.ars_balance, // Número sin comillas
        row.usdc_balance, // Número sin comillas
        row.brl_balance, // Número sin comillas
        row.created_at ? row.created_at.toISOString() : ''
      ].join(';');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // Guardar archivo
    const outputPath = path.join(__dirname, 'usuarios-excel.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');

    console.log(`✅ Archivo CSV creado: ${outputPath}\n`);
    console.log('📋 Este archivo está optimizado para Excel con:');
    console.log('   - Separador: punto y coma (;)');
    console.log('   - Números sin comillas (formato numérico)');
    console.log('   - Compatible con Excel español/europeo\n');

    console.log('💡 CÓMO ABRIR EN EXCEL:');
    console.log('1. Haz doble clic en el archivo usuarios-excel.csv');
    console.log('2. Excel lo abrirá automáticamente con el formato correcto');
    console.log('3. Los números se reconocerán automáticamente\n');

    console.log('📊 PRIMEROS 5 REGISTROS DE EJEMPLO:\n');
    result.rows.slice(0, 5).forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.name}`);
      console.log(`   ARS: ${row.ars_balance} | USD: ${row.usdc_balance} | BRL: ${row.brl_balance}`);
    });

    await db.closeConnections();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

exportAllUsersForExcel();
