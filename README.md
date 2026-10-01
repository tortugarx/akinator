# Nazar

Ein selbstlernendes Figuren-Ratespiel für den Browser. Nazar kombiniert eine kuratierte Wissensbasis mit einer vorab erzeugten Wikidata-Datenbank, einer lokalen Active-Learning-Engine und einem Lernmodus, der bestätigte Figuren im Browser speichert.

## Aktuelles lokales Sprachmodell (Version 27)

Die aktive KI ist **Gemma 3 270M IT QAT Q4_0**, nicht mehr Qwen/ONNX. Die gepinnten GGUF-Gewichte umfassen 241.410.624 Bytes und werden als statische Datei von Hugging Face geladen. Ein Worker prüft und speichert 24-MiB-Teile mit SHA256 und übergibt einen Blob an wllama 3.6.1. Es gibt keine serverseitige Inferenz. CPU-Ausführung mit einem Thread, ohne WebGPU-, FP16-, SharedArrayBuffer- oder Cross-Origin-Isolation-Pflicht; Safari erhält die kompatible WASM-Laufzeit. Der alte 1,22-GB-Download wird nicht mehr gestartet. Vorhandene alte Modell-Caches werden nicht automatisch gelöscht, enthalten aber nicht die neuen Gewichte.

Die Engine ermittelt weiterhin den besten belegten Diskriminator nach Informationsgewinn; das echte Sprachmodell formuliert ihn. Eine dynamische Ausgabegrammatik erhält das Frageverb und verlangt eine einzelne Frage mit Fragezeichen. Sie enthält keinen Fragenkatalog. Der Faktenparser lehnt offene W-Fragen, erfundene Eigenschaften und unpassende Fragen ab. Bei identischer belegter Frageformulierung wird nur das tatsächliche Merkmal zugeordnet, nicht zusätzlich ein überlappendes Thema. Keine heimliche klassische Ersatzfrage bei einem Modellfehler. Dies ist **kein neu feintrainiertes Modell** und kein Nachweis universeller semantischer Korrektheit.

Echte Inferenztests des ausgelieferten Workers, einschließlich Prüfungen der Modellgewichte, testen Spielstart, Bundeskanzler, Erwachsenenfilme, Sänger, Streamer und private Personen in Chromium und WebKit ohne GPU. Der lokale Test ersetzt lediglich den statischen Gewichtsdownload durch dieselben lokalen Bytes; die Inferenz ist nicht simuliert. Ein physisches iPad und ein tatsächlicher CrazyGames-Upload bleiben separat zu prüfen. Das kleinere Modell senkt den Speicherbedarf deutlich, garantiert aber keine Funktion auf jedem Gerät. Erstdownload über ein reales Netz ist nicht mit den lokalen Testzeiten gleichzusetzen.

```bash
npm run build:local-ai
npm start
# Zweites Terminal, installierte Playwright-Browser erforderlich:
node scripts/check-gemma-game.mjs
node scripts/check-gemma-game.mjs --webkit
node scripts/check-gemma-game.mjs --round
```

Gemma hat eigene Nutzungsbedingungen: `assets/ai/models/gemma/TERMS.html` und `NOTICE.txt`. Die Gewichte des GGUF-Exports sind unverändert. Die Laufzeit ist MIT-lizenziert. Das CrazyGames-Buildskript verpackt nur die aktive Gemma-Laufzeit, nicht die alten Qwen-/ONNX-Assets; es wird nicht automatisch ausgeführt. **Noch keine CrazyGames-Freigabe:** 241 MB verpflichtender Erstdownload überschreiten die 50-MB-Startgrenze; bei externen Dateien muss die Plattform die Zeit bis zum Gameplay bewerten. Weitere Download-/Modelloptimierung ist dafür nötig, trotz fehlender GPU-Pflicht.

## Archiv: bisheriges Qwen-Modell (Versionen 23–26, nicht mehr aktiv)

Version 24 behebt den statischen Modelldownload: HTTP 206 wird weiter als Byte-Range verarbeitet; bei HTTP 200 wird ein einzelner vollständiger Download gestreamt, in überprüfte Cache-Teile zerlegt und nicht für jeden Teil erneut gestartet. Vorhandene Cache-Teile bleiben erhalten. Abbruch schließt den Stream; HTTP-Fehler zeigen nun den Statuscode. Das ändert nicht die GPU-/Speicheranforderungen des Modells.

Für CrazyGames ist das große Sprachmodell noch **nicht veröffentlichungsgeeignet**: Laut [technischen Anforderungen](https://docs.crazygames.com/requirements/technical/) gelten 250 MB Paketgröße, 50 MB initialer Download (20 MB für die mobile Startseite) und für externe Dateien höchstens 20 Sekunden bis zum Gameplay. Ein verpflichtender Download von 1,22 GB ist damit keine tragfähige Startarchitektur. Gewählt wurde ein kleineres echtes Sprachmodell für alle Plattformen, nicht ein reines Auswahlmodell. Die [Kandidaten-Untersuchung](SMALL-MODEL-RESEARCH.md) dokumentiert tatsächliche CPU-/Browser-Inferenz mit FLAN-T5-small, SmolLM2-135M und Gemma 3 270M. Gemma läuft in Chromium und WebKit ohne WebGPU, ist aber bislang qualitativ und hinsichtlich des Erstdownloads kein freigegebener Ersatz. Das Vorhandensein des Buildskripts ist keine Plattformfreigabe.

Der standardmäßig angebotene, noch experimentelle KI-Modus führt **Qwen2.5-1.5B-Instruct (q4f16)** mit Transformers.js 4.3.0 in einem Web Worker auf dem Gerät aus. Die Engine bewertet die verfügbaren Fakten nach Informationsgewinn und gibt den besten Diskriminator an das Sprachmodell weiter. Das Modell formuliert diesen um; die Engine leitet aus belegten Merkmalswörtern seine auswertbare Bedingung ab. Der Parser unterstützt auch bis zu drei belegte Merkmale mit UND oder ODER. Nur Vorschläge mit mindestens 80 Prozent des besten verfügbaren Einzelmerkmal-Scores werden akzeptiert. Das kleine Sprachmodell übernimmt ausdrücklich nicht die numerische Optimierung: Eine freie Auswahl aus mehreren Eigenschaften war in echten Tests unzuverlässig. Der KI-Modus verwendet tatsächliche Modell-Inferenz zur Formulierung, nicht nur eine Auswahl fertiger Sätze. Die Merkmalsgrammatik bleibt als Bedeutung der vorhandenen Fakten erhalten; er erfindet keine neuen überprüften Personenmerkmale.

Die Modellgewichte sind unter Apache 2.0 frei nutzbar. Revision, Lizenzen und Teil-Prüfsummen liegen in `assets/ai`. Tokenizer und Laufzeit sind lokale Spielassets. Die **rund 1,22 GB Gewichte werden einmalig als statische Dateien vom öffentlichen Hugging-Face-Modellhost heruntergeladen**, da sie die GitHub-Pages-Paketgrenze überschreiten. Es gibt keine serverseitige Inferenz: Fragen und Antworten verlassen das Gerät nicht. Verifizierte Modellteile werden über die Cache API gespeichert, soweit Speicher verfügbar ist, und nicht bei jedem Spielupdate gelöscht. Alle Modelle brauchen beim ersten Start einen Download; Modell-Cache und HTTP-/Spielasset-Cache sind unterschiedliche Dinge. Lokale `.bin`-Dateien für Diagnosen sind deshalb ausdrücklich nicht Teil des Git-Repositories.

Der KI-Modus benötigt **WebGPU mit FP16 und mindestens 512 MiB Storage-Buffer-Limit**, außerdem mehrere GB freien Arbeitsspeicher. Die Fähigkeit wird vor dem großen Download geprüft. Es gibt keinen CPU-Browser-Fallback: Das 1,5B-Modell überschritt im WebAssembly-Test die Speichergrenze. Eine erfolgreiche Ausführung auf jedem iPad wird nicht zugesagt. Die Oberfläche zeigt reale Downloadfortschritte, sperrt doppelte Eingaben und erlaubt Abbrechen. In Einstellungen oder nach einem KI-Fehler kann ausdrücklich der schnellere klassische Merkmalsmodus gewählt werden. Es gibt keinen stillen Wechsel, der als erfolgreiche Sprachmodell-Inferenz ausgegeben würde.

Das Modell darf nur verfügbare, relevante Merkmale verwenden. Mehrere Fragen, erfundene Eigenschaften, bereits beantwortete Merkmale, unpassende Verknüpfungen, unbelegte Inhaltswörter, ungeprüfte geschlechtsspezifische Berufsformen und Fragen ohne ausreichenden Informationsgewinn werden abgelehnt. Bei einem ungültigen Vorschlag wird einmal mit einem engeren Faktenkontext neu generiert. Strukturierte Vorschläge bleiben ebenfalls auswertbar. Die lexikalische Bedeutungsprüfung ist konservativ, aber **kein vollständiger semantischer Beweis**; frei formulierter Text kann weiterhin Fehler enthalten. Das Modell ist vortrainiert, nicht eigens auf allen Personen feintrainiert, und kann fehlende Daten nicht zuverlässig ersetzen.

Reproduzierbare zusätzliche Prüfungen:

Teststand: 75 automatisierte Tests bestanden. Die echten nativen Inferenztests mit dem vollständigen Datenbestand akzeptieren Fragen für Spielstart, bestätigte Bundeskanzler, Erwachsenenfilm-Darsteller und Sänger. Chromium bestätigt die Geräteprüfung ohne Gewichtsdownload und den ausdrücklich gewählten klassischen Modus. Der separate verzögerte Worker-Test bestätigt Ladefortschritt, Eingabesperre, Mehrfachklick-Schutz, Zurücksetzen der Auswahl und Abbruch; er ist kein Modellqualitätstest. Die vollständige WebGPU-Inferenz konnte im verfügbaren Browser mangels FP16 nicht bestätigt werden. Die Download-Transporttests (HTTP 200/206 und tatsächlicher Modellhost mit kleinem Byte-Probeabruf) bestehen in Chromium und WebKit. Das ist kein vollständiger Safari/iPad-Inferenztest; dieser bleibt unbestätigt.

```bash
npm run build:local-ai
node scripts/check-local-ai.mjs
# Mit laufendem npm start und installiertem Chromium:
node scripts/check-browser-ai.mjs
node scripts/check-browser-ai.mjs --unsupported
node scripts/check-browser-loading.mjs
node scripts/check-browser-download.mjs --remote
# Nach npx playwright install --with-deps webkit:
node scripts/check-browser-download.mjs --webkit --remote
```

Das CrazyGames-Buildskript nimmt Tokenizer, Laufzeit, Manifest und Lizenzen mit auf, nicht die großen lokalen Diagnose-Binärdateien. Es wird nicht automatisch ausgeführt. Externer Modelldownload, Cache-Quoten und Hardwareanforderungen müssen vor einer Einreichung separat mit den Plattformvorgaben abgeglichen werden; die Integration ist keine Zusage einer CrazyGames-Zulassung.

Die ausgelieferte Version umfasst mehr als 17.600 eindeutige Personen, Figuren und private Rollen. Mehr als 14.200 Wiki-Einträge besitzen ein frei lizenziertes Bild aus Wikimedia Commons oder Openverse. Der bisherige Satzkatalog wurde durch eine zweisprachige Merkmalsgrammatik (`feature-schema.js`) ersetzt. Sie enthält weiterhin die Semantik der 294 vorhandenen Merkmale: Ein Ratemodell braucht auswertbare Fragen, deren Antworten zu den gespeicherten Fakten passen. Im ausdrücklich wählbaren klassischen Modus erzeugt `generated-questions.js` zusätzliche Fragen aus belegten Beschreibungsmerkmalen und kombiniert Merkmale abhängig von der aktuellen Kandidatenverteilung. Dies ist eine kontrollierte prozedurale Fragenerzeugung, kein frei formulierendes Sprachmodell. Neue Wissensgebiete entstehen dadurch nicht automatisch.

Ein kleines Bayes-Modell lernt aus positiven und negativen Merkmalen Wahrscheinlichkeiten für unbekannte Antworten. Ja und Nein verändern dieselbe Kandidatenverteilung. Die Auswahl kombiniert erwartete Informationsgewinne mit Themenrelevanz. Ein klares Ja zu seltenen Merkmalen wie Bundeskanzler verankert den passenden Personenkreis; bei mindestens 95 Prozent passender Kandidatenmasse werden Folgefragen innerhalb dieses Kreises bewertet. Unpassende Profile bleiben mit sehr kleiner Wahrscheinlichkeit erhalten, statt neue Berufsfragen zu dominieren. Diese Verankerung hängt von vollständigen und richtigen Daten ab. Unbekannte Beschreibungsmerkmale werden nicht als Nein gespeichert. Ein Nein zu einer zusammengesetzten Oder-Frage schließt ihre einzelnen Merkmale aus, ein Ja bestätigt keines davon einzeln. Länder-Ausschlüsse und Äquivalenzregeln bleiben erhalten. Buchstaben-, Geburtsjahr- und pauschale Jahrhundertfragen werden nicht verwendet.

Die Startseite zeigt zuletzt bestätigte Personen und die häufigsten bestätigten Treffer auf diesem Gerät. Hinzufügen überprüft öffentliche Namen gegen die lokale Datenbank; Teilen nutzt das Betriebssystem oder die Zwischenablage, sofern die Plattform externe Links erlaubt. Sound-Einstellungen werden lokal gespeichert. Publisher ist tortugarx. Berechnungen geben regelmäßig den UI-Thread frei; Eingaben werden sofort gesperrt, der sichtbare Ladeindikator erscheint erst nach 350 ms.

Das Training des Bayes-Antwortmodells läuft beim Erstellen des Spiels; das fertige Modell und seine Auswertung werden in `question-model.js` ausgeliefert. Dieses Antwortmodell benötigt nur gewöhnliches JavaScript, keinen eigenen Server und keine externen Modellabfragen. Es ist vom separat beschriebenen Sprachmodell zu unterscheiden. Ein Fünftel der Personen wird für eine getrennte Antwortvorhersage-Auswertung zurückgehalten, bevor das endgültige Modell auf allen Daten trainiert wird. Die gemessene Log-Loss wird mit der allgemeinen Merkmals-Häufigkeit verglichen. Diese Auswertung misst vorhandene Datenlabels, nicht die Erkennungsrate beliebiger Personen in echten Spielen. Identische oder lückenhafte Profile benötigen weiterhin zusätzliche überprüfte Fakten.

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
