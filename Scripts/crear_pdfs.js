/**
 * @file crear_pdfs.js
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

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/** URL del quadern de NotebookLM d'on s'obtenen les notes. */
const NOTEBOOK_URL = 'https://notebooklm.google.com/notebook/765a4848-2fab-4479-8e50-3761bc1f3754';

/** Directori on es desen els PDFs generats. Es crea automàticament si no existeix. */
const PDFS_DIR = path.join(__dirname, '..', 'pdfs');

/** Executable Python de l'entorn virtual de la skill. */
const PYTHON = path.join(__dirname, '..', '.claude', 'skills', 'notebooklm', '.venv', 'Scripts', 'python');

/** Script Python que llista totes les notes del quadern i retorna un JSON array. */
const LIST_SCRIPT = path.join(__dirname, '..', '.claude', 'skills', 'notebooklm', 'scripts', 'list_studio_notes.py');

/** Script Python que extreu una nota i genera el PDF corresponent. */
const EXTRACT_SCRIPT = path.join(__dirname, '..', '.claude', 'skills', 'notebooklm', 'scripts', 'extract_studio_note.py');

/** Amplada en caràcters de la barra de progrés. */
const BAR_WIDTH = 40;

/** Si és true, sobreescriu els PDFs ja existents en lloc de saltar-los. */
const REWRITE = process.argv.includes('--rewrite');

/** Variables d'entorn comunes per als subprocessos Python (força UTF-8). */
const PYTHON_ENV = { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' };

/**
 * Executa un script Python i retorna el contingut de stdout com a string.
 *
 * @param {string}   script - Path absolut al script Python.
 * @param {string[]} args   - Arguments addicionals per al script.
 * @returns {Promise<string>} Contingut de stdout si el procés acaba amb codi 0.
 * @throws {Error} Si el procés acaba amb codi diferent de 0.
 */
function runPython(script, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON, [script, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: PYTHON_ENV,
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => {
      if (code === 0) resolve(stdout);
      else {
        const lines = (stderr + stdout).trim().split('\n').filter(l => l.trim());
        reject(new Error(lines.pop() || `codi ${code}`));
      }
    });
    proc.on('error', reject);
  });
}

/**
 * Obté la llista de títols de notes del quadern de NotebookLM.
 * Obre Chrome (mode visible) per navegar el quadern i llegir els artefactes
 * del Studio. Retorna un array JSON parsejat.
 *
 * @returns {Promise<string[]>} Array amb els títols de totes les notes trobades.
 */
async function listNotes() {
  const json = await runPython(LIST_SCRIPT, ['--notebook-url', NOTEBOOK_URL]);
  return JSON.parse(json);
}

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
