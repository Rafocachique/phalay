// Configuración autorizada de las tablas WhatsApp. No imprime credenciales ni mensajes.
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const root = path.resolve(__dirname, '..');
for (const file of [path.resolve(root, '../../.env'), path.resolve(root, '.env.local')]) {
  if (fs.existsSync(file)) process.loadEnvFile(file);
}
const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!url) throw new Error('DATABASE_URL no disponible');
const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
(async () => {
  try {
    const rows = await db.$queryRaw`SELECT table_name, column_name, data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name IN ('wa_conversations', 'wa_messages', 'wa_accounts', 'wa_account_members') ORDER BY table_name, ordinal_position`;
    const [base] = await db.$queryRaw`SELECT to_regclass('public.faqs') IS NOT NULL AS phalay_schema`;
    console.log(JSON.stringify({ phalaySchema: base.phalay_schema, existingColumns: rows }));
    if (!base.phalay_schema) throw new Error('No se reconoce el esquema PHALAY');
    if (process.argv.includes('--apply')) {
      if (rows.length && !rows.some((row) => row.table_name === 'wa_conversations' && row.column_name === 'lease_token')) {
        throw new Error('Las tablas existentes requieren una revisión antes de aplicar SQL');
      }
      const sql = fs.readFileSync(path.resolve(root, '../database/whatsapp.sql'), 'utf8');
      const statements = sql.split(';').filter((statement) => statement.trim());
      await db.$transaction(async (tx) => {
        for (const statement of statements) await tx.$executeRawUnsafe(statement);
      }, { timeout: 20_000 });
      console.log('Tablas, índices y RLS de WhatsApp aplicados.');
    }
    const protection = await db.$queryRaw`SELECT relname, relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND relname IN ('wa_conversations', 'wa_messages', 'wa_accounts', 'wa_account_members')`;
    console.log(JSON.stringify({ tables: protection }));
  } catch (error) {
    console.error(JSON.stringify({ error: 'No se pudo completar la operación de base de datos', code: error.code || error.name }));
    process.exitCode = 1;
  } finally { await db.$disconnect(); }
})();
