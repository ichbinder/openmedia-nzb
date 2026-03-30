# OpenMedia NZB

Minimale Datei-Storage API für NZB-Dateien — läuft auf deinem NAS.

> 📚 **Gesamtdokumentation:** [openmedia-docs](https://github.com/ichbinder/openmedia-docs)

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express 5
- **Auth:** JWT (shared secret mit openmedia-api)
- **Storage:** Filesystem
- **Tests:** Vitest + Supertest (15 Tests)

## Architektur

```
openmedia-api ──JWT──▶ openmedia-nzb ──▶ Filesystem
                           │
                      /data/nzb/
                      ├── abc123...sha256.nzb
                      ├── def456...sha256.nzb
                      └── ... (7256 Dateien)
```

Kein eigenes Brain — nur ein authentifizierter Datei-Safe. openmedia-api entscheidet was gespeichert/abgerufen wird, openmedia-nzb führt aus.

## Setup

```bash
npm install
cp .env.example .env   # JWT_SECRET muss mit openmedia-api übereinstimmen!
npm run dev             # → http://localhost:4100
```

## API Endpoints

Alle Endpoints (außer `/health`) erfordern JWT via `Authorization: Bearer <token>`.

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/health` | Health-Check (ohne Auth) |
| GET | `/files` | Alle gespeicherten Hashes auflisten |
| GET | `/files/:hash` | NZB-Datei herunterladen |
| HEAD | `/files/:hash` | Prüfen ob Datei existiert (ohne Download) |
| PUT | `/files/:hash` | NZB-Datei speichern |
| DELETE | `/files/:hash` | NZB-Datei löschen |

## Sicherheit

- **JWT-Auth:** Token wird von openmedia-api ausgestellt, hier nur validiert
- **Path Traversal Protection:** Hash wird auf `[a-f0-9]+` validiert
- **Kein direkter Internetzugang nötig:** Läuft im lokalen Netzwerk

## Tests

```bash
npm test          # 15 Integration Tests
npm run test:watch
```

## Umgebungsvariablen

| Variable | Beschreibung | Default |
|---|---|---|
| `JWT_SECRET` | Muss mit openmedia-api übereinstimmen | (required) |
| `NZB_STORAGE_DIR` | Pfad zum NZB-Speicherordner | `./data/nzb` |
| `PORT` | Server Port | `4100` |
