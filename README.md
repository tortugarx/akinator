# Nazar

Ein selbstlernendes Figuren-Ratespiel für den Browser. Nazar kombiniert eine kuratierte Wissensbasis mit einer vorab erzeugten Wikidata-Datenbank, einer lokalen Active-Learning-Engine und einem Lernmodus, der bestätigte Figuren im Browser speichert.

Die ausgelieferte Version umfasst mehr als 17.600 eindeutige Personen, Figuren und private Rollen. Mehr als 14.200 Wiki-Einträge besitzen ein frei lizenziertes Bild aus Wikimedia Commons oder Openverse. Der bisherige Satzkatalog wurde durch eine zweisprachige Merkmalsgrammatik (`feature-schema.js`) ersetzt. Sie enthält weiterhin die Semantik der 294 vorhandenen Merkmale: Ein Ratemodell braucht auswertbare Fragen, deren Antworten zu den gespeicherten Fakten passen. `generated-questions.js` erzeugt zusätzliche Fragen aus belegten Beschreibungsmerkmalen und kombiniert Merkmale abhängig von der aktuellen Kandidatenverteilung. Dies ist eine kontrollierte prozedurale Fragenerzeugung, kein frei formulierendes Sprachmodell. Neue Wissensgebiete entstehen dadurch nicht automatisch.

Ein kleines Bayes-Modell lernt aus positiven und negativen Merkmalen Wahrscheinlichkeiten für unbekannte Antworten. Ja und Nein verändern dieselbe Kandidatenverteilung. Die Auswahl kombiniert erwartete Informationsgewinne mit Themenrelevanz. Ein klares Ja zu seltenen Merkmalen wie Bundeskanzler verankert den passenden Personenkreis; bei mindestens 95 Prozent passender Kandidatenmasse werden Folgefragen innerhalb dieses Kreises bewertet. Unpassende Profile bleiben mit sehr kleiner Wahrscheinlichkeit erhalten, statt neue Berufsfragen zu dominieren. Diese Verankerung hängt von vollständigen und richtigen Daten ab. Unbekannte Beschreibungsmerkmale werden nicht als Nein gespeichert. Ein Nein zu einer zusammengesetzten Oder-Frage schließt ihre einzelnen Merkmale aus, ein Ja bestätigt keines davon einzeln. Länder-Ausschlüsse und Äquivalenzregeln bleiben erhalten. Buchstaben-, Geburtsjahr- und pauschale Jahrhundertfragen werden nicht verwendet.

Die Startseite zeigt zuletzt bestätigte Personen und die häufigsten bestätigten Treffer auf diesem Gerät. Hinzufügen überprüft öffentliche Namen gegen die lokale Datenbank; Teilen nutzt das Betriebssystem oder die Zwischenablage, sofern die Plattform externe Links erlaubt. Sound-Einstellungen werden lokal gespeichert. Publisher ist tortugarx. Berechnungen geben regelmäßig den UI-Thread frei; Eingaben werden sofort gesperrt, der sichtbare Ladeindikator erscheint erst nach 350 ms.

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
