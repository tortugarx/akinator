# Nazar

Ein selbstlernendes Figuren-Ratespiel für den Browser. Nazar kombiniert eine kuratierte Wissensbasis mit einer vorab erzeugten Wikidata-Datenbank, einer lokalen Active-Learning-Engine und einem Lernmodus, der bestätigte Figuren im Browser speichert.

Die ausgelieferte Version umfasst mehr als 8.200 eindeutige Personen, Figuren und private Rollen. Über 7.200 Wiki-Einträge besitzen ein Porträt aus Wikimedia Commons. Für jede Antwort berechnet die Engine die neue Kandidatenverteilung und wählt anschließend die Frage mit der größten erwarteten Entropiereduktion. Bestätigte Themen aktivieren passende Unterfragen und sperren sachfremde Themen. Buchstaben- und Geburtsjahrfragen werden nicht verwendet.

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

Neu gelernte Figuren und die dazugehörigen Antworten werden ausschließlich in `localStorage` des jeweiligen Browsers abgelegt. Öffentliche Personen werden vor dem Speichern eindeutig gegen die lokale Wiki-Basis geprüft und übernehmen vorhandene Merkmale, Beschreibung, Quelle und Porträt. Nicht überprüfbare Namen sind nur erlaubt, wenn zuvor der private Zweig gewählt wurde. Namenssuche, Fragenwahl und Erkennung laufen lokal; es gibt keinen eigenen Server, keine Laufzeit-API und keinen API-Schlüssel.
