# TechOpps

Collect, classify and track technology opportunities (courses, workshops, bootcamps,
volunteering, internships and jobs, competitions, events and scholarships) from sources
**you** choose. AI extracts the details, and you track deadlines and applications.

| Doc | What's in it |
|---|---|
| [docs/deployment.md](docs/deployment.md) | **Hosting online: Vercel + Render + Neon + GitHub Actions + Gemini** |
| [docs/running-on-windows.md](docs/running-on-windows.md) | Running on Windows: without Docker, or fixing Docker Desktop |
| [docs/requirements-review.md](docs/requirements-review.md) | Decisions and resolved ambiguities |
| [docs/architecture.md](docs/architecture.md) | System design, data model, AI pipeline |
| [docs/security.md](docs/security.md) | Threat model, protections, residual risks |
| [docs/roadmap.md](docs/roadmap.md) | Phases, acceptance criteria, what was verified and how |
| [frontend/DESIGN.md](frontend/DESIGN.md) | Design system: colour, type, components, Light / Dark / Liquid Glass |

**Stack:** Next.js 16 · TypeScript · Tailwind CSS 4 · shadcn/ui · FastAPI · SQLAlchemy 2 ·
Alembic · PostgreSQL 16 · Google Gemini · Docker Compose (optional)

## Hosting online

Step-by-step guide: [docs/deployment.md](docs/deployment.md). Online, the site requires a
password (`APP_PASSWORD`), and the backend accepts only requests from your frontend
(`API_SECRET`).

## Running on your own computer

First create your settings file in the project folder:

```powershell
Copy-Item .env.example .env
notepad .env   # set POSTGRES_PASSWORD (letters and digits) and GEMINI_API_KEY
```

### Option A: Windows without Docker (works with VirtualBox at full speed)

1. Install the prerequisites (once):
   ```powershell
   winget install Python.Python.3.12
   winget install OpenJS.NodeJS.LTS
   winget install PostgreSQL.PostgreSQL.16   # remember the 'postgres' password it asks for
   ```
2. Open a **new** PowerShell window in the project folder and run `.\setup-windows.cmd`.
3. Start TechOpps with `.\start-windows.cmd`. Two windows open (API and web), then the browser
   opens at <http://localhost:3000>.

Details and troubleshooting: [docs/running-on-windows.md](docs/running-on-windows.md).

### Option B: Docker Desktop

```powershell
docker compose up --build
```

Then open <http://localhost:3000>. API docs are at <http://localhost:8000/api/docs>. If
Docker reports a 500 error on `dockerDesktopLinuxEngine`, see
[docs/running-on-windows.md](docs/running-on-windows.md#fixing-docker-desktop).

## First steps in the app

1. **Check the AI.** Go to **Review**, then **Test AI connection**. It shows Google's exact
   answer if the key is rejected.
2. **Add a source.** In **Sources**, add an RSS/Atom feed, an official JSON API, a permitted web
   page, or a *Manual entry* source where you paste announcements yourself. Every source starts
   **inactive**. Press **Activate** and then **Collect now**, or let the scheduler collect it.
3. **Processing.** Collected items are processed by AI automatically about once a minute
   (**Review → Process waiting items now** runs it immediately). Uncertain details and possible
   duplicates appear on **Review**.
4. **Track.** Save opportunities, set a status (applied, registered…), notes and your own target
   date. **Tracking** shows every status as a board. You get reminders 7, 3 and 1 day before each
   deadline.
5. **Appearance.** Choose Light, Dark or Liquid Glass in **Settings** (or press Ctrl K and type
   "glass"). Ctrl K also searches opportunities and jumps to any page.

To try the interface without real data, load fictional sample records. They are clearly
labeled "Sample":

```powershell
.\scripts\windows\seed-samples.cmd                          # native
docker compose exec api python -m app.cli seed-mock         # Docker
# remove them later with: python -m app.cli clear-mock
```

## Command-line tasks

Run them natively with `.\scripts\windows\run-cli.ps1 <command>`, or with
`docker compose exec api python -m app.cli <command>`:

| Command | What it does |
|---|---|
| `test-ai` | Checks that Gemini answers with your key |
| `collect [--source ID]` | Collects due sources now (or one active source) |
| `process [--limit N]` | AI-processes waiting items |
| `reminders` | Creates due deadline reminders |
| `tick` | Runs every scheduled job once |
| `seed-mock` / `clear-mock` | Adds or removes the labeled sample data |

## Tests and checks

```powershell
# Backend (needs the techopps_test database, which setup creates)
cd backend; .venv\Scripts\python -m pytest -q; .venv\Scripts\ruff check .
# Frontend
cd frontend; npm run lint; npm run typecheck; npm test; npm run build
```

With Docker: `docker compose run --rm api pytest -q`. CI runs all of these on every push
(`.github/workflows/ci.yml`).

## Backups

Native: `powershell -ExecutionPolicy Bypass -File scripts\windows\backup.ps1` writes
`backups\techopps-<date>.dump`. Docker: `sh scripts/backup-docker.sh`. The restore commands are
in each script's header.

## Ground rules

- Sources are added **inactive**. Nothing is collected until you activate one, and
  sources that keep failing are paused automatically.
- Unknown details stay empty and are never guessed. Every AI value is traceable to the
  source text, model and prompt version, and unsupported values are flagged for review.
- Secrets live only in `.env`, which is git-ignored. The API has no login, so it listens only on
  your own computer (`127.0.0.1`). Do not expose it to a network.
