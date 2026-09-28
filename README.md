# Nazar

Ein selbstlernendes Figuren-Ratespiel für den Browser. Nazar kombiniert eine kuratierte Wissensbasis mit einer vorab erzeugten Wikidata-Datenbank, einer lokalen Active-Learning-Engine und einem Lernmodus, der bestätigte Figuren im Browser speichert.

Die ausgelieferte Version umfasst mehr als 17.500 eindeutige Personen, Figuren und private Rollen. Über 14.000 Wiki-Einträge besitzen ein Porträt aus Wikimedia Commons. Der Katalog enthält 139 Fragen. Für jede Antwort berechnet die Engine die neue Kandidatenverteilung und bevorzugt belastbare Fragen, die sie möglichst nahe an 50/50 teilen; andernfalls wählt sie die größte erwartete Entropiereduktion. Bestätigte Themen aktivieren passende Unterfragen und sperren sachfremde Themen. Buchstaben- und Geburtsjahrfragen werden nicht verwendet.

Die Wissensbasis unterscheidet neben Unterhaltung, Politik, Sport und Wissenschaft auch Journalismus, Produktion, Gaming, zahlreiche einzelne Sportarten und Wissenschaftsgebiete, Militär, Erwachsenen-Inhalte, Industrie/Fertigung, Medizin, Recht und Religion. Zusätzliche Fragen grenzen fiktive Figuren nach Genre, Art und Universum ein. Zentrale Themenwörter werden in Fragen optisch hervorgehoben.

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

Der Generator wertet populäre Seiten aus zwölf Wikipedia-Sprachräumen aus, löst die zugehörigen Wikidata-Entitäten auf und schreibt eine statische `wikidata-people.json`. Anschließend trainiert er Fragengewichte und geografische Ausschlussbeziehungen in `question-model.js`. So benötigt das veröffentlichte Spiel keine langsamen SPARQL-Abfragen. Wikidata-Daten werden unter CC0 bereitgestellt; Bilder verbleiben auf Wikimedia Commons und sind über den jeweiligen Wikidata-Quellenlink erreichbar.

Das Modell kann ohne erneuten Datenimport separat trainiert werden:

```bash
npm run train:model
```

## CrazyGames-Paket bauen

```bash
npm run build:crazygames
cd dist && zip -r ../nazar-crazygames.zip .
```

Der Build enthält alle Spiel-, Engine- und Wissensdaten und lädt das CrazyGames SDK nur innerhalb der CrazyGames-Umgebung. Externe Navigationslinks werden dort ausgeblendet. Wikimedia-Porträts werden bei Bedarf geladen; bereits betrachtete Bilder speichert die GitHub-Pages-Version im Offline-Cache.

## Datenschutz und Lernen

Neu gelernte Figuren und die dazugehörigen Antworten werden ausschließlich in `localStorage` des jeweiligen Browsers abgelegt. Öffentliche Personen werden vor dem Speichern eindeutig gegen die lokale Wiki-Basis geprüft und übernehmen vorhandene Merkmale, Beschreibung, Quelle und Porträt. Nicht überprüfbare Namen sind nur erlaubt, wenn zuvor der private Zweig gewählt wurde. Namenssuche, Fragenwahl und Erkennung laufen lokal; es gibt keinen eigenen Server, keine Laufzeit-API und keinen API-Schlüssel.

Bestätigte Treffer werden pro Figur ebenfalls nur lokal gezählt und ausdrücklich als Gerätewert angezeigt. Ein globaler Zähler oder gemeinsames Lernen zwischen Nutzern benötigt einen externen, moderierten API-Dienst. Ungeprüfte Antworten sollten niemals direkt das globale Modell verändern, da einzelne Nutzer die Wissensbasis sonst vergiften könnten.
