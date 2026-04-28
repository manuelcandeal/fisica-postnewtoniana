/**
 * @file utils.js
 * @module utils
 * @description Funcions utilitàries compartides per tots els scripts Node.js del projecte.
 */

const { spawn } = require('child_process');
const { PYTHON, LIST_SCRIPT, NOTEBOOK_URL, PYTHON_ENV } = require('./config');

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
 *
 * @returns {Promise<string[]>} Array amb els títols de totes les notes trobades.
 */
async function listNotes() {
  const json = await runPython(LIST_SCRIPT, ['--notebook-url', NOTEBOOK_URL]);
  return JSON.parse(json);
}

module.exports = { runPython, listNotes };