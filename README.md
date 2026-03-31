# openmedia-nzb

Microservice der NZB-Dateien per Hash ausliefert. Die NZB-Dateien liegen auf einem NAS (SMB/CIFS-Freigabe) und werden per Docker-Volume gemountet.

## Architektur

```
Download-Container (Hetzner VPS)
       │
       │  GET /nzb/4532860a...nzb
       ▼
┌──────────────────┐     ┌─────────────────┐
│ openmedia-nzb    │────►│ NAS (SMB/CIFS)  │
│ (nginx)          │     │ /nzb-files/     │
│ Port 3001        │     │ {hash}.nzb      │
└──────────────────┘     └─────────────────┘
       ▲
       │  docker volume (type: cifs)
       │  kein manuelles Mounten nötig
```

## Voraussetzungen

`cifs-utils` muss auf dem Docker-Host installiert sein:

```bash
# Debian/Ubuntu
sudo apt-get install -y cifs-utils

# RHEL/Rocky
sudo dnf install -y cifs-utils
```

## Setup

```bash
cp .env.example .env
# .env ausfüllen mit NAS-Daten

docker compose up -d
```

## Environment Variables

| Variable | Beschreibung | Beispiel |
|----------|-------------|---------|
| `SMB_HOST` | IP oder DNS-Name des NAS | `192.168.1.100` |
| `SMB_SHARE` | Name der SMB-Freigabe | `nzb-files` |
| `SMB_USER` | Benutzername für die Freigabe | `nzb-reader` |
| `SMB_PASSWORD` | Passwort für die Freigabe | `secret` |
| `SMB_VERSION` | SMB-Protokollversion | `3.0` |
| `NZB_PORT` | Port für den HTTP-Service | `3001` |

## API

| Method | Path | Beschreibung |
|--------|------|-------------|
| GET | `/nzb/{hash}.nzb` | NZB-Datei als XML ausliefern |
| GET | `/health` | Healthcheck |

## Dateien auf dem NAS

Die NZB-Dateien liegen als `{hash}.nzb` im SMB-Share:

```
/nzb-files/
├── 4532860a4bb9820f...nzb    (Matrix 1080p)
├── b8e4d1a2c5f7890d...nzb    (Matrix 4K)
├── ...
└── 7256 NZB-Dateien total
```

Die Dateien wurden aus MongoDB exportiert (`scripts/export-nzbs-from-mongo.sh` im openmedia-api Repo).

## Security

- NZB-Service ist **nicht öffentlich** — nur aus dem internen Netz / VPN erreichbar
- SMB-Credentials in `.env` (nicht im Repo)
- Read-only Mount auf das NAS
- Kein Schreibzugriff auf NZB-Dateien
