/**
 * @file resum.js
 * @module resum
 * @description Mostra un resum de l'estat del projecte: quantes notes hi ha al
 * quadern de NotebookLM, quins PDFs s'han generat, quins falten i la mida total
 * dels PDFs ja creats.
 *
 * Prerequisits:
 *  - Skill notebooklm instal·lada a `.claude/skills/notebooklm/`
 *  - Entorn virtual Python creat a `.claude/skills/notebooklm/.venv/`
 *  - Autenticació feta prèviament amb `auth_manager.py setup`
 *  - Node.js instal·lat
 *
 * Ús:
 *  node Scripts/resum.js
 *  node Scripts/resum.js --pendents
 *
 * Exemples:
 *  node Scripts/resum.js              → mostra el resum complet
 *  node Scripts/resum.js --pendents   → mostra només les notes sense PDF
 */

const fs   = require('fs');
const path = require('path');
const { listNotes } = require('./utils');

/**
 * Directori on es cerquen els PDFs generats.
 * @constant {string}
 */
const PDFS_DIR = path.join(__dirname, '..', 'pdfs');

/**
 * Retorna la mida d'un fitxer en una cadena llegible per humans (KB o MB).
 *
 * @param {number} bytes - Mida en bytes.
 * @returns {string} Representació amb unitats, p.ex. `"142.3 KB"` o `"1.4 MB"`.
 */
function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
}

/**
 * Calcula la mida total de tots els PDFs al directori de sortida.
 *
 * @returns {number} Mida total en bytes. Retorna 0 si el directori no existeix.
 */
function totalPdfsSize() {
  if (!fs.existsSync(PDFS_DIR)) return 0;
  return fs.readdirSync(PDFS_DIR)
    .filter(f => f.endsWith('.pdf'))
    .reduce((acc, f) => {
      try { return acc + fs.statSync(path.join(PDFS_DIR, f)).size; } catch { return acc; }
    }, 0);
}

/**
 * Comprova si existeix el PDF d'una nota donada.
 * Busca un fitxer al directori `pdfs/` el nom del qual coincideixi exactament
 * amb el títol de la nota (amb extensió `.pdf`).
 *
 * @param {string} noteTitle - Títol de la nota.
 * @returns {boolean} `true` si el PDF existeix.
 */
function pdfExists(noteTitle) {
  return fs.existsSync(path.join(PDFS_DIR, noteTitle + '.pdf'));
}

/**
 * Punt d'entrada principal.
 * Obté la llista de notes del quadern, creua amb els PDFs existents i imprimeix
 * el resum per consola.
 *
 * @returns {Promise<void>}
 */
async function main() {
  const args = process.argv.slice(2);
  const solisPendents = args.includes('--pendents');

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Ús: node Scripts/resum.js [--pendents]');
    console.log('');
    console.log('Opcions:');
    console.log('  --pendents   Mostra únicament les notes que encara no tenen PDF');
    console.log('');
    console.log('Exemples:');
    console.log('  node Scripts/resum.js');
    console.log('  node Scripts/resum.js --pendents');
    process.exit(0);
  }

  console.log('Obtenint llista de notes del quadern...');

  let notes;
  try {
    notes = await listNotes();
  } catch (err) {
    console.error(`Error en obtenir les notes: ${err.message}`);
    process.exit(1);
  }

  const generades = notes.filter(pdfExists);
  const pendents  = notes.filter(n => !pdfExists(n));
  const mida      = totalPdfsSize();

  if (solisPendents) {
    if (pendents.length === 0) {
      console.log('Tots els PDFs estan generats.');
    } else {
      console.log(`Notes sense PDF (${pendents.length}/${notes.length}):`);
      pendents.forEach((n, i) => console.log(`  ${i + 1}. ${n}`));
    }
    return;
  }

  console.log('');
  console.log(`Quadern: ${notes.length} notes`);
  console.log(`PDFs generats: ${generades.length} / ${notes.length}`);
  if (mida > 0) console.log(`Mida total PDFs: ${formatSize(mida)}`);

  if (generades.length > 0) {
    console.log('');
    console.log('Generats:');
    generades.forEach(n => console.log(`  ✓ ${n}`));
  }

  if (pendents.length > 0) {
    console.log('');
    console.log('Pendents:');
    pendents.forEach(n => console.log(`  ✗ ${n}`));
  } else {
    console.log('');
    console.log('Tots els PDFs estan generats.');
  }
}

main();
