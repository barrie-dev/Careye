# Betonwerken Careye website met contentbeheer

Deze versie bevat een afgeschermd contentbeheer via Pages CMS. De website-eigenaar past teksten, afbeeldingen, projecten, diensten, vacatures, contactgegevens en juridische pagina's aan zonder HTML, CSS of JavaScript te openen.

## Technische opbouw

De inhoud staat in de map `content`.

Pages CMS leest de configuratie uit `.pages.yml` en schrijft wijzigingen rechtstreeks naar GitHub. Cloudflare Pages bouwt daarna automatisch een nieuwe statische versie van de website.

De website gebruikt geen database en heeft geen WordPress updates of plug-ins nodig.

## Lokale build

Vereisten:

- Node.js 20 of nieuwer
- Geen npm-pakketten nodig

Commando's:

```bash
npm run build
npm run preview
```

De gebouwde website staat in `dist`.

## Cloudflare Pages instellingen

Maak een nieuw Cloudflare Pages-project met Git-integratie.

Gebruik deze instellingen:

- Productiebranch: `main`
- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: leeg laten
- Node.js-versie: 20 of nieuwer

Het huidige Direct Upload-project kan niet worden omgezet naar Git-integratie. Maak daarom een nieuw Pages-project en koppel daarna het definitieve domein aan het nieuwe project.

## Pages CMS activeren

1. Plaats deze volledige projectmap in een GitHub-repository.
2. Open `app.pagescms.org`.
3. Meld aan met GitHub.
4. Installeer de Pages CMS GitHub App voor alleen deze repository.
5. Open de repository in Pages CMS.
6. De configuratie uit `.pages.yml` wordt automatisch geladen.
7. Nodig de website-eigenaar uit als beheerder of collaborator.

## Wat de eigenaar kan beheren

- Algemene contactgegevens en vestigingen
- Logo's en sociale media
- Alle teksten en afbeeldingen op de homepage
- Diensten toevoegen, aanpassen, sorteren of verbergen
- Projecten toevoegen, sorteren en publiceren
- Eén project als spotlight op de homepage aanduiden
- Vacatures publiceren of afsluiten
- Contactpagina en offertegegevens
- Algemene voorwaarden, privacy en cookies

## Publicatiewerking

Wanneer de eigenaar in Pages CMS op opslaan klikt:

1. Pages CMS slaat de wijziging op in GitHub.
2. Cloudflare Pages detecteert de nieuwe commit.
3. `npm run build` maakt de website opnieuw.
4. De nieuwe versie wordt automatisch gepubliceerd.

## Belangrijke bestanden

- `.pages.yml`: velden en structuur van het beheerpaneel
- `content/site.json`: algemene bedrijfsgegevens
- `content/pages`: teksten per pagina
- `content/projects`: projecten en spotlight
- `content/services`: diensten
- `content/jobs`: vacatures
- `assets/uploads`: foto's die via Pages CMS worden geüpload
- `scripts/build.mjs`: bouwt de statische website
- `dist`: publiceerbare website

## Beheerpagina

Na publicatie is ook `beheer.html` beschikbaar. Deze pagina bevat een rechtstreekse knop naar Pages CMS. Ze staat bewust niet in de publieke navigatie.


## Formulieren en e-mailverzending

De contactformulieren worden verwerkt door Cloudflare Pages Functions en verstuurd via Resend. Er wordt geen database gebruikt.

Voeg in Cloudflare Pages bij Settings, Variables and Secrets de volgende waarden toe:

- `RESEND_API_KEY`: geheime API-sleutel van Resend
- `FROM_EMAIL`: geverifieerd afzenderadres, bijvoorbeeld `Website Careye <website@betonwerkencareye.be>`
- `INFO_EMAIL`: `info@betonwerkencareye.be`
- `HR_EMAIL`: `hr@betonwerkencareye.be`

Het domein van `FROM_EMAIL` moet in Resend geverifieerd zijn. Contact- en offerteaanvragen gaan naar het algemene infoadres. Sollicitaties en cv-bestanden gaan naar HR. Cv-bestanden mogen maximaal 8 MB groot zijn en moeten PDF, DOC of DOCX zijn.
