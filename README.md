# Generació de PDFs des de NotebookLM

Aquest projecte extreu automàticament totes les notes de Google NotebookLM Studio i les exporta com a PDFs. Inclou eines per llistar les notes disponibles, generar-ne els PDFs en bloc o individualment, fer preguntes al quadern i comprovar l'estat d'autenticació.

---

## Requisits previs

- **Node.js** instal·lat (qualsevol versió LTS)
- **Python 3.10+** instal·lat i accessible des del terminal
- **Google Chrome** instal·lat al sistema
- Un fitxer ZIP amb la skill `notebooklm`

---

## Estructura del projecte

```
projecte/
├── .claude/
│   └── skills/
│       └── notebooklm/                ← skill descomprimida aquí
│           ├── .venv/                  ← entorn virtual Python (es crea manualment)
│           ├── scripts/
│           │   ├── auth_manager.py     ← gestió d'autenticació Google
│           │   ├── browser_utils.py    ← utilitats de navegador (Patchright)
│           │   ├── browser_session.py  ← gestió de sessions de navegador
│           │   ├── cleanup_manager.py  ← neteja de fitxers temporals
│           │   ├── config.py           ← constants i paths centralitzats
│           │   ├── ask_question.py     ← fa preguntes al quadern
│           │   ├── extract_studio_note.py ← extreu una nota i genera el PDF
│           │   ├── list_studio_notes.py   ← llista totes les notes del quadern
│           │   ├── notebook_manager.py ← gestió de la biblioteca de quaderns
│           │   ├── run.py              ← wrapper per executar scripts amb el .venv
│           │   └── setup_environment.py ← crea el .venv i instal·la dependències
│           ├── data/
│           │   ├── auth_info.json      ← metadades d'autenticació
│           │   └── browser_state/
│           │       ├── state.json      ← cookies de sessió (es crea en autenticar)
│           │       └── browser_profile/ ← perfil persistent de Chrome
│           ├── requirements.txt
│           ├── AUTHENTICATION.md
│           └── SKILL.md
├── pdfs/                              ← PDFs generats (es crea automàticament)
└── Scripts/
    ├── config.js          ← constants i paths compartits (URL, Python, scripts)
    ├── utils.js           ← funcions compartides (runPython, listNotes)
    ├── auth_status.js     ← comprova l'estat de l'autenticació Google
    ├── show_notes.js      ← llista les notes del quadern per consola
    ├── extract_nota.js    ← extreu una nota concreta i genera el seu PDF
    ├── crear_pdfs.js      ← genera un PDF per cada nota del quadern
    ├── preguntar.js       ← fa una pregunta al quadern i mostra la resposta
    └── resum.js           ← estat del projecte: notes, PDFs generats i pendents
```

---

## Pas 1 — Instal·lar la skill notebooklm

1. Crea el directori `.claude/skills/` a l'arrel del projecte si no existeix:

   ```
   mkdir .claude\skills
   ```

2. Descomprimeix el ZIP de la skill dins `.claude/skills/`. El resultat ha de ser:

   ```
   .claude\skills\notebooklm\
   ```

   Verifica que hi ha el fitxer `.claude\skills\notebooklm\requirements.txt`.

---

## Pas 2 — Crear l'entorn virtual Python (.venv)

L'entorn virtual ha d'estar vinculat al Python instal·lat al teu usuari. **No copiïs un `.venv` d'un altre ordinador** perquè els paths interns quedaran trencats.

1. Obre un terminal a l'arrel del projecte.

2. Crea el `.venv` amb el teu Python:

   ```
   "C:\Users\<el_teu_usuari>\AppData\Local\Programs\Python\Python313\python.exe" -m venv ".claude\skills\notebooklm\.venv"
   ```

   Substitueix `<el_teu_usuari>` pel teu nom d'usuari de Windows. Si no saps el path exacte de Python, executa `where python` al terminal.

3. Instal·la les dependències:

   ```
   ".claude\skills\notebooklm\.venv\Scripts\pip.exe" install -r ".claude\skills\notebooklm\requirements.txt"
   ```

4. Verifica que Chrome és accessible per Patchright (el navegador ja ha d'estar instal·lat al sistema):

   ```
   ".claude\skills\notebooklm\.venv\Scripts\python.exe" -m patchright install chrome
   ```

   Si respon `"chrome" is already installed`, tot és correcte.

---

## Pas 3 — Autenticar-se a Google NotebookLM (una sola vegada)

La skill usa automació de navegador per accedir a NotebookLM. Cal autenticar-se una vegada per guardar les cookies de sessió.

1. Executa des de l'arrel del projecte:

   ```
   ".claude\skills\notebooklm\.venv\Scripts\python.exe" ".claude\skills\notebooklm\scripts\auth_manager.py" setup
   ```

2. S'obrirà una finestra de **Chrome controlada per Patchright** (diferent del teu Chrome habitual). Inicia sessió amb el compte de Google que té accés al quadern de NotebookLM.

3. Un cop iniciada la sessió i visible la pàgina de NotebookLM, l'script guardarà les cookies automàticament a `.claude\skills\notebooklm\data\browser_state\state.json` i tancarà el navegador.

> **Nota:** Les cookies duren aproximadament 7 dies. Si el procés torna a demanar autenticació, repeteix aquest pas.

Per comprovar l'estat d'autenticació en qualsevol moment:

```
node Scripts/auth_status.js
```

---

## Pas 4 — Configurar el quadern

Obre `Scripts/config.js` i verifica la constant `NOTEBOOK_URL`:

```js
const NOTEBOOK_URL = 'https://notebooklm.google.com/notebook/765a4848-2fab-4479-8e50-3761bc1f3754';
```

Substitueix la URL pel quadern que vols usar si cal. Tots els scripts llegiran la URL d'aquí.

---

## Pas 5 — Executar els scripts

### Llistar les notes del quadern

Per veure totes les notes disponibles al quadern:

```
node Scripts/show_notes.js
```

o bé:

```
npm run notes
```

Sortida d'exemple:

```
Obtenint la llista de notes del quadern...
Notes trobades:
  1. 1. FISICA POST NEWTONIANA
  2. 2. CONCEPTOS FUNDAMENTALES
  3. 3. MÉTODOS DE APROXIMACIÓN
  ...
```

---

### Generar tots els PDFs

Per generar un PDF per cada nota del quadern:

```
node Scripts/crear_pdfs.js
```

o bé:

```
npm run pdfs
```

El programa:
1. Obre Chrome i obté automàticament la llista de totes les notes del quadern.
2. Per cada nota, extreu el contingut i genera un PDF a `pdfs/<títol_nota>.pdf`.
3. Salta les notes que ja tenen PDF generat.

```
Obtenint llista de notes del quadern...
Trobades 20 notes al quadern.

[████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  30% (6/20) 7. PRINCIPIO DE ACCIÓN ESTACIONARIA…
```

Per regenerar tots els PDFs encara que ja existeixin:

```
node Scripts/crear_pdfs.js --rewrite
```

---

### Extreure una nota concreta

Per generar el PDF d'una sola nota sense processar tot el quadern:

```
node Scripts/extract_nota.js <títol>
node Scripts/extract_nota.js <títol> --output <path.pdf>
```

o bé (cal passar el títol com a argument addicional):

```
npm run extract -- "2. CONCEPTOS FUNDAMENTALES"
```

**Arguments:**

| Argument | Obligatori | Descripció |
|---|---|---|
| `<títol>` | Sí | Títol o fragment del títol de la nota |
| `--output <path.pdf>` | No | Path de sortida del PDF. Per defecte: `pdfs/<títol>.pdf` |

**Exemples:**

```
node Scripts/extract_nota.js "2. CONCEPTOS FUNDAMENTALES"
node Scripts/extract_nota.js "conceptos" --output pdfs/conceptos.pdf
node Scripts/extract_nota.js "ones gravitacionals"
```

La cerca del títol és parcial: n'hi ha prou amb un fragment significatiu. Si el PDF de sortida no s'especifica, es desa a `pdfs/<títol>.pdf` (sanititzant caràcters no vàlids per al nom de fitxer).

---

### Fer una pregunta al quadern

Per enviar una pregunta a NotebookLM i rebre la resposta per consola:

```
node Scripts/preguntar.js <pregunta>
node Scripts/preguntar.js <pregunta> --show-browser
```

o bé:

```
npm run preguntar -- "text de la pregunta"
```

**Arguments:**

| Argument | Obligatori | Descripció |
|---|---|---|
| `<pregunta>` | Sí | Text de la pregunta al quadern |
| `--show-browser` | No | Mostra la finestra de Chrome durant la consulta |

**Exemples:**

```
node Scripts/preguntar.js "Quina és la diferència entre coordenades de Boyer-Lindquist i Schwarzschild?"
node Scripts/preguntar.js "Explica el formalisme post-newtonià" --show-browser
node Scripts/preguntar.js "Quins són els termes de correcció PN d'ordre 2 a l'Hamiltonià?"
```

La resposta s'imprimeix formatada per consola. El navegador s'obre en segon pla (headless) per defecte; `--show-browser` el fa visible, útil per depurar si la resposta no arriba.

> **Nota:** Cada invocació obre una nova sessió de navegador. Inclou tota la informació necessària a la pregunta, ja que no hi ha context persistent entre crides.

---

### Veure el resum de l'estat del projecte

Per veure quantes notes hi ha al quadern, quins PDFs s'han generat i quins falten:

```
node Scripts/resum.js
```

o bé:

```
npm run resum
```

Sortida d'exemple:

```
Obtenint llista de notes del quadern...

Quadern: 20 notes
PDFs generats: 15 / 20
Mida total PDFs: 42.3 MB

Generats:
  ✓ 1. FISICA POST NEWTONIANA
  ✓ 2. CONCEPTOS FUNDAMENTALES
  ...

Pendents:
  ✗ 16. ONES GRAVITACIONALS
  ✗ 17. DETECTORS INTERFEROMÈTRICS
  ...
```

**Arguments:**

| Argument | Obligatori | Descripció |
|---|---|---|
| `--pendents` | No | Mostra únicament les notes que encara no tenen PDF |

**Exemples:**

```
node Scripts/resum.js
node Scripts/resum.js --pendents
```

---

### Comprovar l'estat d'autenticació

Per verificar si les cookies de sessió de Google són vàlides:

```
node Scripts/auth_status.js
```

o bé:

```
npm run auth
```

Sortida d'exemple (sessió activa):

```
Comprovant estat d'autenticació...

Authenticated: true
Last login: 2025-04-26T10:32:00

Dies restants estimats: ~4.8 dies
```

Sortida d'exemple (sessió expirada):

```
Comprovant estat d'autenticació...

Not authenticated

Per autenticar-se:
  .claude\skills\notebooklm\.venv\Scripts\python.exe .claude\skills\notebooklm\scripts\auth_manager.py setup
```

Si la sessió ha expirat o no existeix, l'script mostra les instruccions per fer el login de nou.

---

## Referència ràpida de scripts Node.js

| Script | Comanda npm | Descripció |
|---|---|---|
| `Scripts/show_notes.js` | `npm run notes` | Llista les notes del quadern |
| `Scripts/crear_pdfs.js` | `npm run pdfs` | Genera PDFs de totes les notes |
| `Scripts/extract_nota.js` | `npm run extract -- <títol>` | Genera el PDF d'una nota concreta |
| `Scripts/preguntar.js` | `npm run preguntar -- <pregunta>` | Fa una pregunta al quadern |
| `Scripts/resum.js` | `npm run resum` | Mostra l'estat del projecte |
| `Scripts/auth_status.js` | `npm run auth` | Comprova l'estat d'autenticació |

---

## Referència de scripts Node.js

### `Scripts/config.js` — Configuració centralitzada

Exporta totes les constants i paths compartits per la resta de scripts:

| Constant | Descripció |
|---|---|
| `NOTEBOOK_URL` | URL del quadern de NotebookLM |
| `PYTHON` | Path a l'executable Python del `.venv` |
| `LIST_SCRIPT` | Path a `list_studio_notes.py` |
| `EXTRACT_SCRIPT` | Path a `extract_studio_note.py` |
| `PYTHON_ENV` | Variables d'entorn per als subprocessos Python (força UTF-8) |

---

### `Scripts/utils.js` — Funcions compartides

Conté les funcions utilitàries que usen tots els scripts:

**`runPython(script, args)`** — Executa un script Python i retorna stdout com a string. Llança un `Error` si el procés acaba amb codi diferent de 0.

**`listNotes()`** — Invoca `list_studio_notes.py` i retorna un `Promise<string[]>` amb els títols de totes les notes del quadern.

---

### `Scripts/show_notes.js` — Llistar notes

Mostra per consola la llista numerada de totes les notes del quadern. Útil per verificar quines notes existeixen abans de generar PDFs.

```
node Scripts/show_notes.js
```

---

### `Scripts/crear_pdfs.js` — Generar PDFs en bloc

Genera un PDF per cada nota del quadern. Salta els PDFs ja existents per defecte.

```
node Scripts/crear_pdfs.js             # salta els PDFs ja existents
node Scripts/crear_pdfs.js --rewrite   # sobreescriu tots els PDFs
```

Els PDFs es desen a `pdfs/<títol_nota>.pdf`. El directori es crea automàticament si no existeix.

---

### `Scripts/extract_nota.js` — Extreure una nota concreta

Genera el PDF d'una única nota especificada per títol o fragment. Alternativa a `crear_pdfs.js` quan només cal regenerar un fitxer concret.

```
node Scripts/extract_nota.js <títol>
node Scripts/extract_nota.js <títol> --output <path.pdf>
```

| Argument | Obligatori | Descripció |
|---|---|---|
| `<títol>` | Sí | Títol complet o fragment del títol de la nota |
| `--output <path.pdf>` | No | Path de sortida. Per defecte: `pdfs/<títol_sanititzat>.pdf` |

---

### `Scripts/preguntar.js` — Fer preguntes al quadern

Envia una pregunta a NotebookLM via automatització del navegador i mostra la resposta per consola. Fa servir `ask_question.py` de la skill.

```
node Scripts/preguntar.js <pregunta>
node Scripts/preguntar.js <pregunta> --show-browser
```

| Argument | Obligatori | Descripció |
|---|---|---|
| `<pregunta>` | Sí | Text de la pregunta |
| `--show-browser` | No | Mostra el navegador Chrome durant la consulta |

Cada crida obre una nova sessió de navegador independent. El temps de resposta depèn de la complexitat de la pregunta i la velocitat de NotebookLM (habitualment 15–60 segons).

---

### `Scripts/resum.js` — Estat del projecte

Mostra un resum creuat entre les notes del quadern i els PDFs del directori `pdfs/`: quants s'han generat, quants falten i la mida total.

```
node Scripts/resum.js           # resum complet
node Scripts/resum.js --pendents  # només notes sense PDF
```

| Argument | Obligatori | Descripció |
|---|---|---|
| `--pendents` | No | Mostra únicament les notes sense PDF generat |

---

### `Scripts/auth_status.js` — Verificació d'autenticació

Comprova si les cookies de sessió de Google emmagatzemades a `data/browser_state/state.json` són vàlides. Si pot determinar la data del darrer login, estima els dies restants fins a l'expiració (~7 dies de vida útil).

```
node Scripts/auth_status.js
```

Si la sessió ha expirat, mostra la comanda exacta per renovar-la.

---

## Referència de scripts de la skill

### `auth_manager.py` — Gestió d'autenticació

Gestiona el login a Google i la persistència de cookies.

```
# Configurar autenticació (una sola vegada)
python auth_manager.py setup

# Comprovar estat
python auth_manager.py status
```

Les cookies es guarden a `data/browser_state/state.json` i el perfil de Chrome a `data/browser_state/browser_profile/`. Usa un enfocament híbrid (perfil persistent + injecció manual de cookies) per superar un bug de Playwright amb les session cookies.

---

### `ask_question.py` — Fer preguntes al quadern

Obre el quadern de NotebookLM, introdueix la pregunta i espera la resposta. Torna la resposta per stdout.

```
python ask_question.py --question <pregunta> --notebook-url <URL>
python ask_question.py --question <pregunta> --notebook-url <URL> --show-browser
```

| Argument | Descripció |
|---|---|
| `--question` | Text de la pregunta (obligatori) |
| `--notebook-url` | URL del quadern (obligatori si no hi ha quadern actiu a la biblioteca) |
| `--notebook-id` | ID del quadern a la biblioteca (alternativa a `--notebook-url`) |
| `--show-browser` | Mostra el navegador durant la consulta |

---

### `list_studio_notes.py` — Llista notes del quadern

Obre el quadern de NotebookLM, fa scroll per carregar totes les notes del Studio i retorna la llista de títols com a JSON array per stdout.

```
python list_studio_notes.py --notebook-url <URL>
```

**Sortida:** array JSON amb els títols de totes les notes, p.ex.:
```json
["1. FISICA POST NEWTONIANA", "2. CONCEPTOS FUNDAMENTALES", ...]
```

Requereix autenticació prèvia. Obre Chrome en mode visible (`--show-browser` implícit) perquè NotebookLM no carrega els artefactes en mode headless.

---

### `extract_studio_note.py` — Extreu una nota i genera PDF

Obre el quadern, cerca la nota pel títol (cerca parcial per puntuació), extreu el contingut HTML amb les fórmules KaTeX i genera el PDF.

```
python extract_studio_note.py \
  --notebook-url <URL> \
  --note-title <títol o fragment> \
  --output <path.pdf> \
  --show-browser
```

| Argument | Descripció |
|---|---|
| `--notebook-url` | URL del quadern de NotebookLM |
| `--note-title` | Títol o fragment del títol de la nota |
| `--output` | Path de sortida del PDF (ha d'acabar en `.pdf`) |
| `--show-browser` | Mostra el navegador (necessari per carregar els artefactes) |

El PDF es genera amb un Chrome headless separat per evitar la limitació de Playwright (`page.pdf()` requereix headless). Les fórmules matemàtiques es renderitzen amb KaTeX.

---

### `browser_utils.py` — Utilitats de navegador

Conté `BrowserFactory.launch_persistent_context()` que crea un context de Chrome amb:
- Perfil persistent (`user_data_dir`) per mantenir el fingerprint
- Injecció manual de cookies des de `state.json` (workaround pel bug [playwright#36139](https://github.com/microsoft/playwright/issues/36139))
- Flags anti-detecció (`--disable-blink-features=AutomationControlled`, etc.)

---

### `config.py` — Configuració centralitzada

Defineix tots els paths, selectores CSS de NotebookLM i timeouts. Punt únic de configuració per a tots els scripts.

---

### `run.py` — Wrapper d'execució

Garanteix que els scripts s'executen sempre amb el Python del `.venv`. Crea el `.venv` automàticament si no existeix.

```
python run.py auth_manager.py status
python run.py list_studio_notes.py --notebook-url <URL>
```

---

### `setup_environment.py` — Configuració de l'entorn

Crea el `.venv`, instal·la les dependències de `requirements.txt` i instal·la Chrome per Patchright.

---

## Solució de problemes

| Problema | Causa | Solució |
|---|---|---|
| `ENOENT` en executar | El `.venv` no existeix o el path és incorrecte | Refés el Pas 2 |
| `spawn ... ENOENT` amb path `C:\Users\AltreUsuari\...` | El `.venv` va ser creat per un altre usuari | Esborra el `.venv` i refés el Pas 2 |
| `Not authenticated` | No s'ha fet el setup o les cookies han expirat (>7 dies) | Refés el Pas 3 |
| `Found 0 artifacts` | El navegador no ha carregat els artefactes | Assegura't d'usar `--show-browser` |
| `Executable doesn't exist at .../headless_shell.exe` | S'intenta usar Chromium headless shell sense instal·lar | Verifica que el codi usa `channel="chrome"` al browser headless |
| `Could not find note: <nom>` | La nota no existeix al quadern | Crea la nota al Studio de NotebookLM |
| `UnicodeEncodeError` | Python no pot imprimir caràcters especials al terminal | Ja corregit: el Node.js força `PYTHONIOENCODING=utf-8` |
| PDF no es genera (HTML sí) | `page.pdf()` no funciona en mode visible | Ja corregit: el PDF es genera amb un browser headless separat |
| `preguntar.js` no retorna resposta | NotebookLM tarda massa o la sessió ha expirat | Comprova auth amb `npm run auth`; prova amb `--show-browser` |
