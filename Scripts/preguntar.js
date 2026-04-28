/**
 * @file preguntar.js
 * @module preguntar
 * @description Fa una pregunta al quadern de Google NotebookLM i mostra la resposta
 * per consola. Utilitza `ask_question.py` de la skill notebooklm per automatitzar
 * la interacció amb el navegador.
 *
 * Prerequisits:
 *  - Skill notebooklm instal·lada a `.claude/skills/notebooklm/`
 *  - Entorn virtual Python creat a `.claude/skills/notebooklm/.venv/`
 *  - Autenticació feta prèviament amb `auth_manager.py setup`
 *  - Node.js instal·lat
 *
 * Ús:
 *  node Scripts/preguntar.js <pregunta>
 *  node Scripts/preguntar.js <pregunta> --show-browser
 *
 * Exemples:
 *  node Scripts/preguntar.js "Quina és la diferència entre coordenades de Boyer-Lindquist i Schwarzschild?"
 *  node Scripts/preguntar.js "Explica el formalisme post-newtonià" --show-browser
 */

const path = require('path');
const { NOTEBOOK_URL, PYTHON } = require('./config');
const { runPython } = require('./utils');

/**
 * Path al script Python que fa preguntes al quadern de NotebookLM.
 * @constant {string}
 */
const ASK_SCRIPT = path.join(__dirname, '..', '.claude', 'skills', 'notebooklm', 'scripts', 'ask_question.py');

/**
 * Amplada de la línia separadora que s'imprimeix al voltant de la resposta.
 * @constant {number}
 */
const SEPARATOR_WIDTH = 60;

/**
 * Envia una pregunta al quadern de NotebookLM i retorna la resposta.
 *
 * @param {string}  question    - Text de la pregunta.
 * @param {boolean} showBrowser - Si és `true`, mostra la finestra del navegador.
 * @returns {Promise<string>} Text de la resposta de NotebookLM.
 */
function askQuestion(question, showBrowser) {
  const args = [
    '--question',    question,
    '--notebook-url', NOTEBOOK_URL,
  ];
  if (showBrowser) args.push('--show-browser');
  return runPython(ASK_SCRIPT, args);
}

/**
 * Punt d'entrada principal.
 * Analitza els arguments de línia de comandes, envia la pregunta al quadern
 * i formata la resposta per consola.
 *
 * @returns {Promise<void>}
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Ús: node Scripts/preguntar.js <pregunta> [--show-browser]');
    console.log('');
    console.log('Arguments:');
    console.log('  <pregunta>      Text de la pregunta al quadern (obligatori)');
    console.log('  --show-browser  Mostra la finestra del navegador durant la consulta');
    console.log('');
    console.log('Exemples:');
    console.log('  node Scripts/preguntar.js "Quina és la diferència entre coordenades de Boyer-Lindquist i Schwarzschild?"');
    console.log('  node Scripts/preguntar.js "Explica el formalisme post-newtonià" --show-browser');
    process.exit(0);
  }

  const showBrowser = args.includes('--show-browser');
  const questionArgs = args.filter(a => a !== '--show-browser');
  const question = questionArgs.join(' ');

  if (!question.trim()) {
    console.error('Error: cal especificar una pregunta.');
    process.exit(1);
  }

  console.log('Enviant pregunta al quadern...');
  console.log('');

  try {
    const output = await askQuestion(question, showBrowser);

    // La resposta de ask_question.py inclou línies de log i la resposta final
    // Busquem el bloc entre les línies separadores "======..."
    const sepLine = '='.repeat(SEPARATOR_WIDTH);
    const sepIdx  = output.indexOf(sepLine);

    if (sepIdx !== -1) {
      // Mostra la sortida tal qual, que ja ve formatada per ask_question.py
      console.log(output.slice(sepIdx));
    } else {
      // Fallback: mostra tota la sortida
      console.log(output);
    }
  } catch (err) {
    console.error(`Error en consultar el quadern: ${err.message}`);
    process.exit(1);
  }
}

main();
