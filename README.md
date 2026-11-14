# Noodle Gmail App

A Google Workspace Gmail add-on prototype for Noodle CRM.

## What I reviewed

I checked the existing Noodle CRM codebase and it is a Next.js 16 application built on:

- Supabase
- Vercel hosting
- Google OAuth integrations for Gmail/Calendar
- CRM entities like contacts, leads, companies, and deals

The Gmail add-on pattern that fits this stack is a Google Workspace Gmail add-on built with Apps Script and CardService, then calling Noodle CRM through a Vercel endpoint or Supabase edge API.

## Design direction

The add-on should behave like a lightweight HubSpot/Salesforce email side panel:

- Open a Gmail message
- See the sender and subject context
- Match or create a CRM contact
- Create a lead from the message
- Create a deal from the thread
- Sync the email activity back to CRM

The UI pattern is intentionally simple:

- a top card with CRM identity
- sender / company / thread summary
- CTA buttons for Create contact, Create lead, Create deal, Sync email
- lightweight success state after action

## Project structure

- `Code.gs` — Gmail add-on card and action handlers
- `appsscript.json` — Workspace manifest for Gmail contextual cards
- `lib/crm-core.js` — pure payload builders for CRM contact, lead, deal, and email activity objects
- `tests/crm-core.test.js` — validation around payload normalization and formatting

## Local validation

```bash
npm test
```

This passes and confirms the payload logic for the CRM sync flow.

## Deployment to Google Workspace

1. Install the Apps Script CLI:

```bash
npm install -g @google/clasp
```

2. Log in:

```bash
clasp login
```

3. Create the project:

```bash
clasp create --title "Noodle Gmail Add-on" --type standalone
```

4. Push the app files:

```bash
clasp push
```

5. In Google Workspace, publish the add-on for your organization.

6. Add Script Properties in Apps Script:

- `CRM_BASE_URL` — e.g. `https://your-vercel-app.vercel.app`
- `CRM_API_KEY` — service token or signed token for the CRM API
- `CRM_OWNER_EMAIL` — default owner email for created leads

## Suggested CRM API contract

Your Vercel app can expose a route like:

```http
POST /api/gmail/sync
```

with a JSON body shaped like:

```json
{
  "action": "contact|lead|deal|email",
  "payload": {
    "email": "person@example.com",
    "company": "Northwind",
    "subject": "Need pricing for 50 seats",
    "message": "We are interested in a product demo",
    "source": "gmail"
  }
}
```

This keeps the Gmail add-on generic and lets the CRM remain the source of truth for record creation and field mapping.

## Notes

The current prototype is intentionally implementation-ready but not tied to a live Supabase schema yet. Once you give me the actual CRM API routes or the Supabase table names, I can wire the add-on directly to the real system and replace the generic payloads with the exact schema used in Noodle CRM.
