# Nazar

Ein selbstlernendes Figuren-Ratespiel für den Browser. Nazar kombiniert eine kuratierte Wissensbasis mit einer vorab erzeugten Wikidata-Datenbank, einer probabilistischen Fragenwahl und einem Lernmodus, der unbekannte Figuren im Browser speichert.

Die ausgelieferte Version umfasst derzeit 8.262 eindeutige Personen, Figuren und private Rollen. 7.232 Wiki-Einträge besitzen ein Porträt aus Wikimedia Commons. Fragen werden anhand des erwarteten Informationsgewinns ausgewählt; geraten wird, sobald die Kandidatenwahrscheinlichkeit ausreicht – nicht nach einer festen Fragenzahl.

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

## CrazyGames-Paket bauen

```bash
npm run build:crazygames
cd dist && zip -r ../nazar-crazygames.zip .
```

Der Build enthält alle Spiel-, Engine- und Wissensdaten und lädt das CrazyGames SDK nur innerhalb der CrazyGames-Umgebung. Externe Navigationslinks werden dort ausgeblendet. Wikimedia-Porträts werden bei Bedarf geladen; bereits betrachtete Bilder speichert die GitHub-Pages-Version im Offline-Cache.

## Datenschutz und Lernen

Neu gelernte Figuren und die dazugehörigen Antworten werden ausschließlich in `localStorage` des jeweiligen Browsers abgelegt. Namenssuche, Fragenwahl und Erkennung laufen gegen die mitgelieferte lokale Wissensbasis; es gibt keinen eigenen Server, keine Laufzeit-API und keinen API-Schlüssel.
