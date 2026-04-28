/**
 * @file auth_status.js
 * @module auth_status
 * @description Comprova l'estat de l'autenticació Google per a la skill notebooklm.
 * Mostra si les cookies de sessió són vàlides, la data del darrer login i una
 * estimació dels dies que queden fins que expirarà la sessió (~7 dies de vida útil).
 *
 * Prerequisits:
 *  - Skill notebooklm instal·lada a `.claude/skills/notebooklm/`
 *  - Entorn virtual Python creat a `.claude/skills/notebooklm/.venv/`
 *  - Node.js instal·lat
 *
 * Ús:
 *  node Scripts/auth_status.js
 *
 * Exemples:
 *  node Scripts/auth_status.js
 */

const path = require('path');
const { PYTHON, PYTHON_ENV } = require('./config');
const { spawn } = require('child_process');

/**
 * Path al script Python que gestiona l'autenticació.
 * @constant {string}
 */
const AUTH_SCRIPT = path.join(__dirname, '..', '.claude', 'skills', 'notebooklm', 'scripts', 'auth_manager.py');

/**
 * Vida útil estimada de les cookies de sessió de Google NotebookLM en dies.
 * @constant {number}
 */
const SESSION_LIFETIME_DAYS = 7;

/**
 * Executa `auth_manager.py status` i retorna la sortida bruta.
 *
 * @returns {Promise<string>} Sortida stdout del script Python.
 */
function runAuthStatus() {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON, [AUTH_SCRIPT, 'status'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: PYTHON_ENV,
    });
    let out = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { out += d.toString(); });
    proc.on('close', () => resolve(out));
    proc.on('error', reject);
  });
}

/**
 * Extreu la data ISO del darrer login de la sortida de `auth_manager.py status`.
 * Busca patrons com `Last login: 2025-04-22T...` o `Authenticated: true`.
 *
 * @param {string} output - Sortida bruta del script Python.
 * @returns {Date|null} Data del darrer login, o `null` si no es pot determinar.
 */
function parseLastLogin(output) {
  const match = output.match(/(?:last[_\s]login|authenticated[_\s]at|date)[:\s]+([0-9T:\-\.Z+]+)/i);
  if (match) {
    const d = new Date(match[1]);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Punt d'entrada principal.
 * Crida `auth_manager.py status`, analitza la sortida i mostra per consola
 * l'estat de l'autenticació, la data del darrer login i els dies restants.
 *
 * @returns {Promise<void>}
 */
async function main() {
  console.log('Comprovant estat d\'autenticació...');
  console.log('');

  let output;
  try {
    output = await runAuthStatus();
  } catch (err) {
    console.error(`Error en comprovar l'autenticació: ${err.message}`);
    process.exit(1);
  }

  // Mostra la sortida original del script Python
  console.log(output.trim());
  console.log('');

  // Intenta enriquir amb informació de dies restants si trobem la data
  const lastLogin = parseLastLogin(output);
  if (lastLogin) {
    const ageMs   = Date.now() - lastLogin.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const left    = SESSION_LIFETIME_DAYS - ageDays;

    if (left > 0) {
      console.log(`Dies restants estimats: ~${left.toFixed(1)} dies`);
    } else {
      console.log('La sessió probablement ha expirat. Refés l\'autenticació:');
      console.log('  .claude\\skills\\notebooklm\\.venv\\Scripts\\python.exe .claude\\skills\\notebooklm\\scripts\\auth_manager.py setup');
    }
  }

  // Indica el pas a seguir si no hi ha autenticació
  if (/not authenticated|no auth|false/i.test(output)) {
    console.log('');
    console.log('Per autenticar-se:');
    console.log('  .claude\\skills\\notebooklm\\.venv\\Scripts\\python.exe .claude\\skills\\notebooklm\\scripts\\auth_manager.py setup');
  }
}

main();
