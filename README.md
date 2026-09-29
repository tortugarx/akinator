# Nazar

Ein selbstlernendes Figuren-Ratespiel für den Browser. Nazar kombiniert eine kuratierte Wissensbasis mit einer vorab erzeugten Wikidata-Datenbank, einer lokalen Active-Learning-Engine und einem Lernmodus, der bestätigte Figuren im Browser speichert.

Die ausgelieferte Version umfasst mehr als 17.500 eindeutige Personen, Figuren und private Rollen. Mehr als 14.200 Wiki-Einträge besitzen ein frei lizenziertes Bild aus Wikimedia Commons oder Openverse. Der Katalog enthält 275 Fragen. Für jede Antwort berechnet die Engine die neue Kandidatenverteilung und bevorzugt belastbare Fragen, die sie möglichst nahe an 50/50 teilen; andernfalls wählt sie die größte erwartete Entropiereduktion. Bestätigte Themen priorisieren passende Unterfragen stark, blockieren überlappende Laufbahnen aber nicht mehr. Eigene Unterbäume unterscheiden unter anderem Schauspiel, Adult/OnlyFans, Musik, Streaming, Creator-Inhalte, Politik, Literatur, Militär und Unternehmen. Buchstaben-, Geburtsjahr- und pauschale Jahrhundertfragen werden nicht verwendet.

Die Wissensbasis unterscheidet neben Unterhaltung, Politik, Sport und Wissenschaft auch Musikgenres, Creator-Plattformen, politische Ämter, Berufsstatus, Journalismus, Produktion, Gaming, zahlreiche einzelne Sportarten und Wissenschaftsgebiete, Militär, Erwachsenen-Inhalte, Industrie/Fertigung, Medizin, Recht und Religion. Länder werden hierarchisch über Region und Teilregion eingegrenzt. Zusätzliche Fragen grenzen fiktive Figuren nach Genre, Rolle und Universum ein. Zentrale Themenwörter werden in Fragen optisch hervorgehoben.

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

Der Generator wertet populäre Seiten aus zwölf Wikipedia-Sprachräumen aus, löst die zugehörigen Wikidata-Entitäten auf und schreibt eine statische `wikidata-people.json`. Anschließend trainiert `npm run train:model` globale und branchenspezifische Fragengewichte, geografische Ausschlussbeziehungen und semantische Implikationen in `question-model.js`. Dadurch kann eine global seltene Frage innerhalb ihrer Branche besonders wertvoll sein. Erkennt das Training beispielsweise, dass „Rennfahrer“ zuverlässig „Motorsportler“ impliziert, wird die bereits beantwortete allgemeinere Frage später übersprungen. Nach einem falschen Tipp verlangt die Engine drei neue Antworten, bevor sie erneut raten darf. Während einer längeren Neuberechnung sperrt ein sichtbarer Denkstatus weitere Eingaben. So benötigt das veröffentlichte Spiel keine langsamen SPARQL-Abfragen. Wikidata-Daten werden unter CC0 bereitgestellt; Bilder verbleiben auf Wikimedia Commons und sind über den jeweiligen Wikidata-Quellenlink erreichbar.

Das Modell kann ohne erneuten Datenimport separat trainiert werden:

```bash
npm run train:model
```

Fehlende Personenbilder lassen sich anschließend sicher ergänzen:

```bash
npm run enrich:images
```

Die wiederaufnehmbare Pipeline prüft zuerst strukturierte Commons-Daten und verwendet Openverse als streng gefilterten Fallback. Sie akzeptiert nur Public Domain, CC0, CC BY und CC BY-SA, verwirft typische Fehlmotive und speichert Urheber, Lizenz sowie Quellseite. Wegen der anonymen Openverse-Grenze werden standardmäßig höchstens 18 neue Openverse-Suchen pro Lauf ausgeführt; wiederholte Läufe setzen am gespeicherten Stand fort.

## CrazyGames-Paket bauen

```bash
npm run build:crazygames
cd dist && zip -r ../nazar-crazygames.zip .
```

Der Build enthält alle Spiel-, Engine- und Wissensdaten und lädt das CrazyGames SDK nur innerhalb der CrazyGames-Umgebung. Externe Navigationslinks werden dort ausgeblendet. Wikimedia-Porträts werden bei Bedarf geladen; bereits betrachtete Bilder speichert die GitHub-Pages-Version im Offline-Cache.

## Datenschutz und Lernen

Neu gelernte Figuren und die dazugehörigen Antworten werden ausschließlich in `localStorage` des jeweiligen Browsers abgelegt. Öffentliche Personen werden vor dem Speichern eindeutig gegen die lokale Wiki-Basis geprüft und übernehmen vorhandene Merkmale, Beschreibung, Quelle, Porträt und Bildnachweis. Nicht überprüfbare Namen sind nur erlaubt, wenn zuvor der private Zweig gewählt wurde. Namenssuche, Fragenwahl und Erkennung laufen lokal; es gibt keinen eigenen Server und keinen API-Schlüssel. Commons und Openverse werden ausschließlich beim Erzeugen der statischen Wissensbasis abgefragt, nicht während einer Spielrunde.

Bestätigte Treffer werden pro Figur ebenfalls nur lokal gezählt und ausdrücklich als Gerätewert angezeigt. Ein globaler Zähler oder gemeinsames Lernen zwischen Nutzern benötigt einen externen, moderierten API-Dienst. Ungeprüfte Antworten sollten niemals direkt das globale Modell verändern, da einzelne Nutzer die Wissensbasis sonst vergiften könnten.
