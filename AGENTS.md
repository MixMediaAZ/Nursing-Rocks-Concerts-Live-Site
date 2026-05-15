Required build behavior



Before major changes:



Inspect the repo.

Read package.json.

Identify the framework.

Identify the dev command.

Identify the build command.

Identify existing routes/pages/components.

Identify likely failure points.

Produce a plan before editing.



After changes:



Run dependency install if needed.

Run build/test/lint when available.

Restart dev server cleanly.

Verify the browser URL when possible.

Report exact errors if verification fails.

Port policy



Never assume port 3000 is free.



For Node apps, prefer a start.bat that:



changes into the project folder,

installs dependencies if node\_modules is missing,

finds or allows an open port,

starts the app,

prints the local URL.

UI / UX policy



When improving UI:



Preserve working functionality.

Prefer modern clean layouts.

Keep navigation obvious.

Avoid burying core workflows.

Make buttons and status messages clear.

Add visible error states.

Avoid mystery loading states.

Code quality

Prefer simple architecture over clever architecture.

Use typed validation when available.

Keep files organized by feature.

Avoid duplicate logic.

Avoid uncontrolled global state.

Add useful logging around startup, ports, API failures, and file operations.

Do not introduce new dependencies unless they are justified.

Verification checklist



Before claiming success, check:



App installs.

App starts.

App builds if build script exists.

No obvious console crash.

Main route loads.

Critical workflow is reachable.

Any new command is documented.

'@ | Set-Content -Encoding UTF8 "$template\\AGENTS.md"

@'

alwaysApply: true



Follow the project instructions in @AGENTS.md.



Before significant edits:



inspect the actual files,

create a clear plan,

list exact files to change,

list verification commands.



For Dave's projects:



no placeholder code,

no mock-only features,

no fixed ports,

complete files preferred,

Windows-first instructions,

verify before claiming success.

'@ | Set-Content -Encoding UTF8 "$template.cursor\\rules\\dave-build-rules.mdc"



@'



Secrets



.env

.env.\*

\*\*/.env

\*/.env.

\*.pem

\*.key

\*.p12

\*.pfx

secrets/

private/



Dependencies



node\_modules/

.pnpm-store/

.yarn/



Build output



dist/

build/

.next/

out/

coverage/

.cache/

.turbo/



Git internals



.git/



Python junk



pycache/

.pytest\_cache/

venv/

.venv/



OS junk



.DS\_Store

Thumbs.db

'@ | Set-Content -Encoding UTF8 "$template.cursorignore"



@'



Do not index giant or generated files



node\_modules/

dist/

build/

.next/

out/

coverage/

.cache/

.turbo/

uploads/

renders/

exports/

public/uploads/

public/renders/

\*.mp4

\*.mov

\*.avi

\*.mkv

\*.wav

\*.aiff

\*.flac

\*.zip

\*.7z

\*.rar

\*.stl

\*.obj

\*.glb

\*.gltf

'@ | Set-Content -Encoding UTF8 "$template.cursorindexingignore"



@'

{

"files.autoSave": "onFocusChange",

"editor.formatOnSave": true,

"editor.minimap.enabled": false,

"editor.wordWrap": "on",

"terminal.integrated.defaultProfile.windows": "Command Prompt",

"search.exclude": {

"/node\_modules": true,

"/dist": true,

"/build": true,

"/.next": true,

"/coverage": true,

"/.cache": true

},

"files.exclude": {

"/.DS\_Store": true,

"/Thumbs.db": true

},

"eslint.validate": \[

"javascript",

"javascriptreact",

"typescript",

"typescriptreact"

]

}

'@ | Set-Content -Encoding UTF8 "$template.vscode\\settings.json"



@'



Cursor First Prompt Template



Use this prompt when opening a new or existing app in Cursor.



Fill in the bracketed fields first.



APP NAME:

\[APP\_NAME]



PROJECT FOLDER:

\[PASTE\_FULL\_WINDOWS\_FOLDER\_PATH]



GOAL:

\[WHAT THIS APP MUST DO]



STACK IF KNOWN:

\[Node / React / Vite / Next / Express / Prisma / Python / unknown]



DEPLOY TARGET:

\[Local only / Render / Vercel / Namecheap VPS / unknown]



MUST KEEP:

\[FEATURES OR UI THAT MUST NOT BE REMOVED]



KNOWN PROBLEMS:

\[ERROR MESSAGES OR BROKEN BEHAVIOR]



PROMPT TO CURSOR:



You are working on APP NAME: \[APP\_NAME].



This is a Windows desktop build. First inspect the repository before editing anything.



Do not modify files yet.



Do this first:



Read package.json if present.

Identify the framework and app structure.

Identify install/dev/build/test commands.

Identify likely startup problems.

Identify where the main UI lives.

Identify whether the app already has start.bat.

Identify whether the app hardcodes ports.

Identify any obvious broken imports, missing dependencies, or config problems.

Produce a plan with exact files to change.

Include verification commands.



Dave's build rules:



no placeholder code,

no mock-only features,

no fixed ports,

no destructive commands,

preserve working functionality,

use complete files where safer,

Windows-first instructions,

verify before claiming success.



Wait for approval before implementing the plan.

'@ | Set-Content -Encoding UTF8 "$template\\START\_HERE\_CURSOR\_PROMPT.md"



Write-Host ""

Write-Host "Created Cursor project template here:"

Write-Host $template

Write-Host ""

