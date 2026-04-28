/**
 * @file show_notes.js
 * @description Llista per consola tots els títols de notes del quadern de NotebookLM.
 *
 * Ús:
 *   node Scripts/show_notes.js
 */

const { listNotes } = require('./utils');

console.log('Obtenint la llista de notes del quadern...');
listNotes().then(notes => {
  console.log('Notes trobades:');
  notes.forEach((note, i) => {
    console.log(`  ${i + 1}. ${note}`);
  });
}).catch(err => {
  console.error('Error obtenint la llista de notes:', err);
});