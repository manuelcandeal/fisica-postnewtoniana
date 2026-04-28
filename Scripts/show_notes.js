/** Script Python que llista totes les notes del quadern i retorna un JSON array. */
const LIST_SCRIPT = path.join(__dirname, '..', '.claude', 'skills', 'notebooklm', 'scripts', 'list_studio_notes.py');

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

console.log ('Obtenint la llista de notes del quadern...');
listNotes().then(notes => {
  console.log('Notes trobades:'); 
    notes.forEach((note, i) => {
        console.log(`  ${i + 1}. ${note}`);
    });
}).catch(err => {
    console.error('Error obtenint la llista de notes:', err);
});