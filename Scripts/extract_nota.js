/**
 * @file extract_nota.js
 * @module extract_nota
 * @description Extreu una nota del quadern de Google NotebookLM Studio i genera el
 * seu PDF corresponent. Permet especificar la nota per títol complet o fragment, i
 * opcionalment un path de sortida personalitzat.
 *
 * Prerequisits:
 *  - Skill notebooklm instal·lada a `.claude/skills/notebooklm/`
 *  - Entorn virtual Python creat a `.claude/skills/notebooklm/.venv/`
 *  - Autenticació feta prèviament amb `auth_manager.py setup`
 *  - Node.js instal·lat
 *
 * Ús:
 *  node Scripts/extract_nota.js <títol>
 *  node Scripts/extract_nota.js <títol> --output <path.pdf>
 *
 * Exemples:
 *  node Scripts/extract_nota.js "2. CONCEPTOS FUNDAMENTALES"
 *  node Scripts/extract_nota.js "conceptos" --output pdfs/conceptos.pdf
 *  node Scripts/extract_nota.js "ones gravitacionals"
 */

const fs   = require('fs');
const path = require('path');
const { NOTEBOOK_URL, EXTRACT_SCRIPT } = require('./config');
const { runPython } = require('./utils');

/**
 * Directori per defecte on es desen els PDFs generats.
 * @constant {string}
 */
const PDFS_DIR = path.join(__dirname, '..', 'pdfs');

/**
 * Extreu una nota de NotebookLM i genera el PDF corresponent.
 *
 * @param {string} noteTitle  - Títol o fragment del títol de la nota.
 * @param {string} outputPath - Path de sortida del fitxer PDF.
 * @returns {Promise<void>}
 */
function extractNote(noteTitle, outputPath) {
  return runPython(EXTRACT_SCRIPT, [
    '--notebook-url', NOTEBOOK_URL,
    '--note-title',   noteTitle,
    '--output',       outputPath,
    '--show-browser',
  ]);
}

/**
 * Punt d'entrada principal.
 * Analitza els arguments de línia de comandes, construeix el path de sortida
 * i invoca l'extracció de la nota.
 *
 * @returns {Promise<void>}
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Ús: node Scripts/extract_nota.js <títol> [--output <path.pdf>]');
    console.log('');
    console.log('Arguments:');
    console.log('  <títol>              Títol o fragment del títol de la nota (obligatori)');
    console.log('  --output <path.pdf>  Path de sortida del PDF (opcional)');
    console.log('');
    console.log('Exemples:');
    console.log('  node Scripts/extract_nota.js "2. CONCEPTOS FUNDAMENTALES"');
    console.log('  node Scripts/extract_nota.js "conceptos" --output pdfs/conceptos.pdf');
    process.exit(0);
  }

  const outputFlagIdx = args.indexOf('--output');
  let noteTitle;
  let outputPath;

  if (outputFlagIdx !== -1) {
    outputPath = args[outputFlagIdx + 1];
    noteTitle  = args.filter((_, i) => i !== outputFlagIdx && i !== outputFlagIdx + 1).join(' ');
  } else {
    noteTitle = args.join(' ');
  }

  if (!noteTitle) {
    console.error('Error: cal especificar el títol de la nota.');
    process.exit(1);
  }

  if (!outputPath) {
    if (!fs.existsSync(PDFS_DIR)) fs.mkdirSync(PDFS_DIR, { recursive: true });
    const safeName = noteTitle.replace(/[<>:"/\\|?*]/g, '_');
    outputPath = path.join(PDFS_DIR, safeName + '.pdf');
  }

  console.log(`Nota:   ${noteTitle}`);
  console.log(`Sortida: ${outputPath}`);
  console.log('Generant PDF...');

  try {
    await extractNote(noteTitle, outputPath);
    console.log(`PDF generat correctament: ${outputPath}`);
  } catch (err) {
    console.error(`Error en generar el PDF: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { extractNote };
