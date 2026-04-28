/**
 * @file config.js
 * @module config
 * @description Constants i paths centralitzats per als scripts del projecte.
 * Tots els scripts Node.js han d'importar les configuracions d'aquí.
 */

const path = require('path');

/**
 * URL del quadern de NotebookLM d'on s'obtenen les notes.
 * @constant {string}
 */
const NOTEBOOK_URL = 'https://notebooklm.google.com/notebook/765a4848-2fab-4479-8e50-3761bc1f3754';

/**
 * Path a l'executable Python de l'entorn virtual de la skill notebooklm.
 * @constant {string}
 */
const PYTHON = path.join(__dirname, '..', '.claude', 'skills', 'notebooklm', '.venv', 'Scripts', 'python');

/**
 * Path al script Python que llista totes les notes del quadern i retorna un JSON array.
 * @constant {string}
 */
const LIST_SCRIPT = path.join(__dirname, '..', '.claude', 'skills', 'notebooklm', 'scripts', 'list_studio_notes.py');

/**
 * Path al script Python que extreu una nota i genera el PDF corresponent.
 * @constant {string}
 */
const EXTRACT_SCRIPT = path.join(__dirname, '..', '.claude', 'skills', 'notebooklm', 'scripts', 'extract_studio_note.py');

/**
 * Variables d'entorn per als subprocessos Python. Força la codificació UTF-8
 * per evitar errors amb caràcters especials al terminal de Windows.
 * @constant {Object}
 */
const PYTHON_ENV = { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' };

module.exports = { NOTEBOOK_URL, PYTHON, LIST_SCRIPT, EXTRACT_SCRIPT, PYTHON_ENV };

