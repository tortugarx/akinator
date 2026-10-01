# Limule: belegbare Erkenntnisse und Umsetzung

Die offizielle Akinator-FAQ nennt Limule als Eigenentwicklung von Elokence.
Sie veröffentlicht keinen Quellcode oder reproduzierbaren Algorithmus:
https://ru.akinator.com/content/6/-a-e-a-u-a-a-

Sasson und Kenett (2023) untersuchen beobachtete Akinator-Fragen. Sie hatten
keinen Zugriff auf die Fragen-Auswahlimplementierung oder die Datenbank.
Informationsgewinn, binäre Trennung, Fehlerrobustheit und Unterhaltung werden
als mögliche Strategien diskutiert; das beweist nicht, dass Limule genau diese
Verfahren verwendet. Die Ergebnisse zeigen außerdem thematische Fragegruppen:
https://cognitive-complexity.net.technion.ac.il/files/2023/03/BDCC-07-00026.pdf

EP2720216A2 ist eine Anmeldung von **Zanzoon SAS**, nicht Elokence. Akinator
wird darin als bestehendes Vergleichssystem erwähnt. Diese Anmeldung darf
nicht als offengelegter Limule-Algorithmus dargestellt werden:
https://data.epo.org/publication-server/rest/v1.2/publication-dates/20140416/patents/EP2720216NWA2/document.pdf

Nazar implementiert deshalb einen eigenen Ansatz mit denselben Spielzielen:
gewichteter Informationsgewinn, lokal aktualisierte Kandidatenwahrscheinlichkeiten,
Ja- und Nein-Evidenz, separate Behandlung unbekannter Fakten, thematische
Relevanz, stabile Merkmals-IDs gegen Wiederholungen und eine konservativere
Trefferschwelle. Das Sprachmodell formuliert belegte Fragen; es erfindet keine
Biografien. Zusätzliche Detailfragen entstehen aus nachweisbaren Wiki-Aussagen.

Ein Profil-Audit prüft alle geladenen Profile auf identische beobachtbare
Merkmalsvektoren. Solche Gruppen bleiben Datenlücken; Popularität darf sie
nicht als gelöst erscheinen lassen. Der Audit ist kein Nachweis, dass jeder
Spieler alle Fakten kennt oder jeder Spielverlauf konvergiert.
