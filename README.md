# Nazar

Ein selbstlernendes Figuren-Ratespiel für den Browser. Nazar kombiniert eine lokale Wissensbasis mit 100+ echten und fiktiven Figuren, einer probabilistischen Fragenwahl und einem Lernmodus, der unbekannte Figuren über Wikidata nachschlägt und im Browser speichert.

## Lokal starten

```bash
npm start
```

Danach `http://localhost:4173` öffnen.

## Tests

```bash
npm test
```

Die Tests prüfen unter anderem den früheren Abbruch nach sechs Fragen sowie einen vollständigen Durchlauf für jede mitgelieferte Figur.

## Datenschutz und Lernen

Neu gelernte Figuren und die dazugehörigen Antworten werden ausschließlich in `localStorage` des jeweiligen Browsers abgelegt. Für die optionale Namenssuche wird die öffentliche Wikidata-API verwendet; es gibt keinen eigenen Server und keinen API-Schlüssel.
