# Nazar

Ein selbstlernendes Figuren-Ratespiel für den Browser. Nazar kombiniert eine kuratierte Wissensbasis mit einer vorab erzeugten Wikidata-Datenbank, einer probabilistischen Fragenwahl und einem Lernmodus, der unbekannte Figuren im Browser speichert.

Die ausgelieferte Version umfasst derzeit mehr als 3.000 eindeutige Personen und Figuren. Über 2.600 Einträge besitzen ein Porträt aus Wikimedia Commons. Fragen werden anhand des erwarteten Informationsgewinns ausgewählt; geraten wird, sobald die Kandidatenwahrscheinlichkeit ausreicht – nicht nach einer festen Fragenzahl.

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

## Wikidata-Datenbank aktualisieren

```bash
npm run build:wikidata
```

Der Generator wertet populäre deutsch- und englischsprachige Wikipedia-Seiten aus, löst die zugehörigen Wikidata-Entitäten auf und schreibt eine statische `wikidata-people.json`. So benötigt das veröffentlichte Spiel keine langsamen SPARQL-Abfragen. Wikidata-Daten werden unter CC0 bereitgestellt; Bilder verbleiben auf Wikimedia Commons und sind über den jeweiligen Wikidata-Quellenlink erreichbar.

## Datenschutz und Lernen

Neu gelernte Figuren und die dazugehörigen Antworten werden ausschließlich in `localStorage` des jeweiligen Browsers abgelegt. Für die optionale Namenssuche wird die öffentliche Wikidata-API verwendet; es gibt keinen eigenen Server und keinen API-Schlüssel.
