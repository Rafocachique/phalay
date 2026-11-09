// Genera únicamente secretos internos locales; nunca solicita ni imprime claves de Meta.
const { randomBytes } = require('node:crypto');
const { readFileSync, existsSync, appendFileSync } = require('node:fs');
const { resolve } = require('node:path');
const root = resolve(__dirname, '..');
const target = resolve(root, '.env.local');
const sources = [target, resolve(root, '.env'), resolve(root, '../../.env.local'), resolve(root, '../../.env')]
  .filter(existsSync).map((path) => readFileSync(path, 'utf8')).join('\n');
const missing = ['WHATSAPP_VERIFY_TOKEN', 'CRON_SECRET'].filter((key) =>
  !new RegExp(`^\\s*${key}\\s*=\\s*[^\\s#]+`, 'm').test(sources));
if (missing.length) {
  appendFileSync(target, '\n# Secretos internos para WhatsApp; no subir a Git.\n' +
    missing.map((key) => `${key}=${randomBytes(32).toString('hex')}`).join('\n') + '\n', { mode: 0o600 });
}
console.log(`Configuración local preparada. Secretos creados: ${missing.length}. No se muestran sus valores.`);
