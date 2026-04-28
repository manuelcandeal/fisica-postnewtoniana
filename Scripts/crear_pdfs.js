/**
 * @file crear_pdfs.js
 * @module crear_pdfs
 * @description Genera un PDF per cada nota que existeix al quadern de Google
 * NotebookLM Studio. Primer obté la llista de notes directament del quadern
 * (via `list_studio_notes.py`) i després extreu i exporta cada nota com a PDF
 * (via `extract_studio_note.py`). Si el PDF ja existeix, el salta per defecte.
 *
 * Prerequisits:
 *  - Skill notebooklm instal·lada a `.claude/skills/notebooklm/`
 *  - Entorn virtual Python creat a `.claude/skills/notebooklm/.venv/`
 *  - Autenticació feta prèviament amb `auth_manager.py setup`
 *  - Node.js instal·lat
 *
 * Ús:
 *  node Scripts/crear_pdfs.js            → salta els PDFs ja existents
 *  node Scripts/crear_pdfs.js --rewrite  → sobreescriu tots els PDFs
 */

const fs = require('fs');
const path = require('path');
const { NOTEBOOK_URL, EXTRACT_SCRIPT } = require('./config');
const { runPython, listNotes } = require('./utils');

/**
 * Directori on es desen els PDFs generats. Es crea automàticament si no existeix.
 * @constant {string}
 */
const PDFS_DIR = path.join(__dirname, '..', 'pdfs');

/**
 * Amplada en caràcters de la barra de progrés.
 * @constant {number}
 */
const BAR_WIDTH = 40;

/**
 * Si és `true`, sobreescriu els PDFs ja existents en lloc de saltar-los.
 * S'activa passant l'argument `--rewrite` a la línia de comandes.
 * @constant {boolean}
 */
const REWRITE = process.argv.includes('--rewrite');

/**
 * Extreu una nota de NotebookLM i genera el PDF corresponent.
 * Obre Chrome (mode visible) per cercar la nota pel títol, extreu el contingut
 * HTML i el converteix a PDF amb un Chrome headless separat.
 *
 * @param {string} noteTitle - Títol exacte de la nota al quadern de NotebookLM.
 * @returns {Promise<void>} Es resol si el PDF es genera correctament.
 */
function extractNote(noteTitle) {
  const outputPath = path.join(PDFS_DIR, noteTitle + '.pdf');
  return runPython(EXTRACT_SCRIPT, [
    '--notebook-url', NOTEBOOK_URL,
    '--note-title',   noteTitle,
    '--output',       outputPath,
    '--show-browser',
  ]);
}

/**
 * Dibuixa o actualitza la barra de progrés a la mateixa línia del terminal.
 *
 * @param {number} current - Nombre de notes processades fins ara.
 * @param {number} total   - Nombre total de notes.
 * @param {string} label   - Text descriptiu que es mostra al costat de la barra.
 */
function drawProgressBar(current, total, label) {
  const pct = current / total;
  const filled = Math.round(pct * BAR_WIDTH);
  const bar = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
  const percent = Math.round(pct * 100).toString().padStart(3);
  const counter = `${current}/${total}`;
  const maxLabel = 100 - BAR_WIDTH - 15;
  const shortLabel = label.length > maxLabel ? label.slice(0, maxLabel - 1) + '…' : label;
  process.stdout.write(`\r[${bar}] ${percent}% (${counter}) ${shortLabel}`);
}

/**
 * Punt d'entrada principal.
 * 1. Obté la llista de notes del quadern.
 * 2. Per cada nota, genera el PDF (saltant les existents si no s'usa --rewrite).
 * 3. Mostra una barra de progrés i recull els errors per mostrar-los al final.
 *
 * @returns {Promise<void>}
 */
async function main() {
  if (!fs.existsSync(PDFS_DIR)) fs.mkdirSync(PDFS_DIR, { recursive: true });

  console.log('Obtenint llista de notes del quadern...');
  let notes;
  try {
    notes = await listNotes();
  } catch (err) {
    console.error(`Error en obtenir les notes: ${err.message}`);
    process.exit(1);
  }

  const total = notes.length;
  console.log(`Trobades ${total} notes al quadern.${REWRITE ? ' (mode --rewrite: sobreescriu existents)' : ''}\n`);

  const errors = [];
  let skipped = 0;

  for (let i = 0; i < total; i++) {
    const note = notes[i];
    const pdfPath = path.join(PDFS_DIR, note + '.pdf');
    const nextLabel = i + 1 === total ? 'Completat' : notes[i + 1];

    if (!REWRITE && fs.existsSync(pdfPath)) {
      skipped++;
      drawProgressBar(i + 1, total, nextLabel);
      continue;
    }

    drawProgressBar(i, total, note);
    try {
      await extractNote(note);
    } catch (err) {
      errors.push({ note, msg: err.message });
    }
    drawProgressBar(i + 1, total, nextLabel);
  }

  process.stdout.write('\n');

  if (skipped > 0) console.log(`(${skipped}/${total} notes saltades, ja tenien PDF)`);

  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    errors.forEach(e => console.log(`  ✗ ${e.note}\n    → ${e.msg}`));
  }

  console.log('\nFet.');
}

main();
