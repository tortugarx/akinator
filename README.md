# Nazar

Ein selbstlernendes Figuren-Ratespiel für den Browser. Nazar kombiniert eine kuratierte Wissensbasis mit einer vorab erzeugten Wikidata-Datenbank, einer lokalen Active-Learning-Engine und einem Lernmodus, der bestätigte Figuren im Browser speichert.

Die ausgelieferte Version umfasst mehr als 17.600 eindeutige Personen, Figuren und private Rollen. Mehr als 14.200 Wiki-Einträge besitzen ein frei lizenziertes Bild aus Wikimedia Commons oder Openverse. Der Katalog enthält 294 Fragen. Ein kleines Bayes-Modell lernt aus bekannten positiven und negativen Merkmalen Wahrscheinlichkeiten für unbekannte Antworten. Fehlende Angaben öffentlicher kuratierter Profile werden nicht als negative Trainingslabels verwendet. Die Engine aktualisiert nach Ja und Nein dieselbe Kandidatenverteilung und wählt die größte erwartete Entropiereduktion über beide möglichen Antworten. Länderfragen können ohne vorherige regionale Ja-Antwort gewählt werden; logische Widersprüche und Dopplungen bleiben ausgeschlossen. Bei großen Datenbanken berücksichtigt eine gewichtete Stichprobe auch Kandidaten außerhalb der ersten 1.000 Treffer. Seltene bestätigte Bereiche wie private Beziehungen oder Adult-Inhalte erhalten einen eigenen Prior. Buchstaben-, Geburtsjahr- und pauschale Jahrhundertfragen werden nicht verwendet.

Das Training läuft beim Erstellen des Spiels; das fertige Modell und seine Auswertung werden in `question-model.js` ausgeliefert. Der Browser benötigt nur gewöhnliches JavaScript, keinen eigenen Server und keine externen Modellabfragen. Ein Fünftel der Personen wird für eine getrennte Antwortvorhersage-Auswertung zurückgehalten, bevor das endgültige Modell auf allen Daten trainiert wird. Die gemessene Log-Loss wird mit der allgemeinen Merkmals-Häufigkeit verglichen. Diese Auswertung misst vorhandene Datenlabels, nicht die Erkennungsrate beliebiger Personen in echten Spielen. Identische oder lückenhafte Profile benötigen weiterhin zusätzliche überprüfte Fakten.

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

Die Tests prüfen unter anderem Nein-Evidenz, das lokale Antwortmodell, logische Ausschlüsse, unbekannte Daten, den privaten Fragenzweig sowie vollständige Durchläufe mit der großen Datenbank für konkrete Fehlerfälle. Identische Profile müssen als unsicher behandelt werden; bloßes Durchraten aller Namen zählt nicht als erfolgreiche Erkennung.

## Wikidata-Datenbank aktualisieren

```bash
npm run build:wikidata
```

Der Generator wertet populäre Seiten aus zwölf Wikipedia-Sprachräumen aus, löst die zugehörigen Wikidata-Entitäten auf und schreibt eine statische `wikidata-people.json`. Anschließend trainiert `npm run train:model` das Bayes-Antwortmodell einschließlich einer Auswertung mit zurückgehaltenen Personen. Die Fragenwahl verwendet dessen Antwortwahrscheinlichkeiten; globale und branchenspezifische Gewichte werden für bestehende Auswertungen weiterhin exportiert. Geografische Ausschlüsse und semantische Implikationen verhindern widersprüchliche oder bereits beantwortete Fragen. Nach einem falschen Tipp verlangt die Engine drei neue Antworten, bevor sie erneut raten darf. Ein Tipp benötigt mindestens 70 Prozent modellierte Kandidatenwahrscheinlichkeit und einen deutlichen Abstand zum zweiten Kandidaten. Sind keine informativen Fragen mehr verfügbar, wird fehlendes Wissen angezeigt. Während einer längeren Neuberechnung sperrt ein sichtbarer Denkstatus weitere Eingaben. Das veröffentlichte Spiel benötigt keine SPARQL-Abfragen. Wikidata-Daten werden unter CC0 bereitgestellt; Bilder verbleiben auf Wikimedia Commons und sind über den jeweiligen Wikidata-Quellenlink erreichbar.

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
