@echo off
chcp 65001 >nul
cd c:\Users\Manuel\.claude\skills\notebooklm
c:
SET PYTHONUTF=1

.venv\Scripts\python scripts\extract_studio_note.py --notebook-url https://notebooklm.google.com/notebook/765a4848-2fab-4479-8e50-3761bc1f3754 --note-title "1. FISICA POST NEWTONIANA. ORIGENES. CURSO DE FÍSICA POST-NEWTONIANA. "  --output "E:\Fisica\Post Newtoniana\1. FISICA POST NEWTONIANA. ORIGENES. CURSO DE FÍSICA POST-NEWTONIANA..pdf" --show-browser
.venv\Scripts\python scripts\extract_studio_note.py --notebook-url https://notebooklm.google.com/notebook/765a4848-2fab-4479-8e50-3761bc1f3754 --note-title "2. CONCEPTOS FUNDAMENTALES. CURSO DE FÍSICA POST-NEWTONIANA."  --output "E:\Fisica\Post Newtoniana\2. CONCEPTOS FUNDAMENTALES. CURSO DE FÍSICA POST-NEWTONIANA.pdf" --show-browser
.venv\Scripts\python scripts\extract_studio_note.py --notebook-url https://notebooklm.google.com/notebook/765a4848-2fab-4479-8e50-3761bc1f3754 --note-title "3. CONCEPTO DE ENERGÍA. CURSO DE FÍSICA POST-NEWTONIANA."  --output "E:\Fisica\Post Newtoniana\3. CONCEPTO DE ENERGÍA. CURSO DE FÍSICA POST-NEWTONIANA.pdf" --show-browser
.venv\Scripts\python scripts\extract_studio_note.py --notebook-url https://notebooklm.google.com/notebook/765a4848-2fab-4479-8e50-3761bc1f3754 --note-title "4. LEYES DE CONSERVACIÓN. CURSO DE FÍSICA POST-NEWTONIANA."  --output "E:\Fisica\Post Newtoniana\4. LEYES DE CONSERVACIÓN. CURSO DE FÍSICA POST-NEWTONIANA.pdf" --show-browser
