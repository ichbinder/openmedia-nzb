# OpenMedia NZB

Minimale Datei-Storage API für NZB-Dateien. Kein Brain, nur Filesystem-CRUD mit JWT-Auth.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express 5
- **Auth:** JWT (shared secret mit openmedia-api)
- **Storage:** Filesystem (konfigurierbar per ENV)
- **Tests:** Vitest + Supertest

## Setup

```bash
# Dependencies installieren
npm install

# .env erstellen (JWT_SECRET muss mit openmedia-api übereinstimmen)
cp .env.example .env

# Dev-Server starten
npm run dev
```

## API Endpoints

Alle Endpoints (außer /health) erfordern JWT-Auth via `Authorization: Bearer <token>`.

| Methode | Endpoint | Beschreibung |
|---|---|---|
| `GET` | `/health` | Health-Check (ohne Auth) |
| `GET` | `/files` | Alle gespeicherten Hashes auflisten |
| `GET` | `/files/:hash` | NZB-Datei herunterladen |
| `HEAD` | `/files/:hash` | Prüfen ob Datei existiert |
| `PUT` | `/files/:hash` | NZB-Datei speichern |
| `DELETE` | `/files/:hash` | NZB-Datei löschen |

## Tests

```bash
npm test        # einmalig
npm run test:watch  # watch-modus
```

## Architektur

```
openmedia-api ──JWT──▶ openmedia-nzb
                        │
                        ├── PUT /files/abc123  → speichert abc123.nzb
                        ├── GET /files/abc123  → liefert abc123.nzb
                        └── DELETE /files/abc123 → löscht abc123.nzb
```

Der JWT wird von openmedia-api ausgestellt und hier nur validiert (shared secret).
