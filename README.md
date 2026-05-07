# WinkelPro — Inventarisatie Systeem

Volledig winkel inventarisatie systeem gebouwd met Next.js 14, PostgreSQL en Prisma. Klaar voor Docker.

## Functionaliteiten

- **Dashboard** — omzetgrafiek, lage voorraad alerts, top producten
- **Producten** — catalogus beheren met SKU, prijzen, BTW en marge
- **Verkopen** — winkelwagen interface, voorraad wordt automatisch bijgehouden
- **Voorraad** — actuele status en volledige mutatielog (audit trail)
- **Rapportages** — genereer PDF-rapporten en verstuur automatisch per e-mail
- **Instellingen** — e-mail ontvangers instellen voor automatische maandrapportages

## Snelle start met Docker

```bash
# 1. Clone of unzip het project
cd inventarisatie-systeem

# 2. Kopieer en pas omgevingsvariabelen aan
cp .env.example .env
# Bewerk .env: vul BREVO_API_KEY in voor e-mail

# 3. Start alle containers
docker compose up -d --build

# 4. Open de app
open http://localhost:3000
```

De database wordt automatisch aangemaakt en gevuld met voorbeelddata.

## Lokale ontwikkeling

```bash
npm install

# Database starten
docker compose up db -d

# Omgevingsvariabelen instellen
cp .env.example .env.local
# Pas DATABASE_URL aan naar localhost

# Migraties uitvoeren
npx prisma migrate dev
node prisma/seed.js

# Dev server
npm run dev
```

## Projectstructuur

```
app/
  page.tsx              # Dashboard
  producten/            # Productbeheer
  verkopen/             # Verkoopregistratie
  voorraad/             # Voorraadoverzicht
  rapportages/          # Rapport generatie
  instellingen/         # E-mail configuratie
  api/                  # REST API routes
  lib/
    prisma.ts           # Database client
    utils.ts            # Hulpfuncties
  components/
    layout/Sidebar.tsx  # Navigatie
    ui/                 # UI componenten
prisma/
  schema.prisma         # Database schema
  seed.js               # Voorbeelddata
Dockerfile
docker-compose.yml
```

## Omgevingsvariabelen

| Variabele | Beschrijving | Verplicht |
|-----------|-------------|-----------|
| `DATABASE_URL` | PostgreSQL connectiestring | Ja |
| `BREVO_API_KEY` | API sleutel van app.brevo.com | Voor e-mail |
| `EMAIL_FROM` | Afzenderadres voor rapportages | Voor e-mail |
| `EMAIL_NAAM` | Afzendernaam (bijv. WinkelPro) | Voor e-mail |

## Automatische maandrapportage

De `cron` container verstuurt automatisch op de 1e van elke maand om 08:00 een rapportage naar alle ingestelde ontvangers. Beheer ontvangers via **Instellingen** in de app.

## Technologie

- **Next.js 14** (App Router, Server Components)
- **PostgreSQL 16** via Prisma ORM
- **Recharts** voor grafieken
- **Brevo** voor e-mailversturing
- **Docker + Docker Compose** voor deployment
