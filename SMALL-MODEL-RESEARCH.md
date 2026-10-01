# Kleineres echtes Sprachmodell: Messstand 1. Oktober 2026

Ziel ist lokale Textgenerierung auch ohne WebGPU, nicht ein als LLM bezeichnetes Auswahlmodell. Die folgenden Zahlen dokumentieren die ursprüngliche Kandidaten-Untersuchung vor der Integration. **Nachtrag Version 27:** Der unveränderte 241-MB-Gemma-Export wird jetzt mit einer dynamischen Frageverb-/Ja-Nein-Ausgabegrammatik eingesetzt. Dadurch bestehen die sechs separaten Chromium-/WebKit-Inferenzkontexte; die geprüfte Bundeskanzler-Runde läuft bis zum Tipp. Die unten dokumentierte zusätzliche Embedding-Quantisierung wurde nicht eingesetzt. Gemma wurde nicht feintrainiert. Aktuelle Architektur und Tests stehen in der README; CrazyGames-Ladegrenzen sind weiterhin nicht erfüllt.

## Tatsächlich ausgeführte Inferenz

Vier Kontexte aus der vollständigen Spieldatenbank: Spielstart, bestätigter Bundeskanzler, bestätigter Erwachsenenfilm-Darsteller und bestätigter Sänger. Die Engine liefert ihren besten belegten Diskriminator; das Modell soll ihn als deutsche Ja/Nein-Frage formulieren. Dieser kleine Test prüft weder selbstständige Merkmalsauswahl noch die Erkennungsrate aller Personen.

| Modell/Export | Gewichte, dezimale MB | Laufzeit | Ergebnis des ersten Prompts |
| --- | ---: | --- | --- |
| FLAN-T5-small, ONNX q8 | 95,10 | Native CPU, Transformers.js 4.3.0 | 0/4 Parser-Akzeptanzen; Leerzeichen statt Fragen |
| SmolLM2-135M-Instruct, ONNX q4f16 | 117,27 | Native CPU, Transformers.js 4.3.0 | 0/4; fehlerhafte/repetitive deutsche Ausgaben |
| Gemma 3 270M IT QAT, GGUF Q4_0 | 241,41 | Chromium CPU-WASM, ein Thread | 3/4; etwa 3,3–4,8 Sekunden pro Ausgabe |
| Dasselbe Gemma | 241,41 | WebKit CPU-WASM, ein Thread | 3/4; etwa 4,2–5,9 Sekunden pro Ausgabe |

Das sind echte Modellaufrufe, keine simulierten Antworten. Native ONNX-Tests sind keine Browser-Kompatibilitätsnachweise. Ein Scheitern dieser Exporte/Prompts beweist nicht, dass jede andere Exportversion oder ein feintrainiertes Modell ebenfalls scheitert.

Bei Gemma antwortet der ursprüngliche Prompt auf die Geschlechtsfrage auf Englisch, statt eine Frage zu stellen. WebKit scheiterte zunächst im URL-/Cache-Ladepfad mit `UnknownError`; direkte Übergabe des heruntergeladenen `Blob` an `loadModel()` funktionierte. Ein tatsächliches iPad/Safari und der CrazyGames-Iframe sind damit nicht getestet. Lokale Ladezeiten messen keinen Erstdownload über ein Mobilfunknetz.

## Zusätzliche Verkleinerung von Gemma

Die großen Token-Embeddings wurden ebenfalls auf Q4_0 requantisiert. Ergebnis: **157.524.544 Bytes**, rund 35 Prozent weniger als der GGUF-Ausgangsexport und rund 87 Prozent weniger als die derzeitigen Qwen-Gewichte. Die WASM-Laufzeit und die Spieldaten kommen zusätzlich hinzu.

Der ursprüngliche englische Prompt erreichte mit dieser kleineren Datei in Chromium nur 1/4 Parser-Akzeptanzen (3,6–5,6 Sekunden). Eine deutsche Anweisung und eine englische Few-shot-Anweisung mit Beispiel ergaben jeweils 2/4 Parser-Akzeptanzen in Chromium und WebKit. Der deutsche Prompt erzeugte dabei auch „Wie oft kommen diese Person aus den USA?“. Der Parser akzeptierte diese Ausgabe irrtümlich; sie ist **keine** brauchbare Ja/Nein-Frage. Parser-Akzeptanz ist daher ausdrücklich kein vollständiger Qualitätsmaßstab. Der Few-shot-Prompt wiederholte bei zwei Aufgaben die Musikfrage aus seinem Beispiel. Diese Varianten sind ungeeignet; die kleinere Datei ist qualitativ nicht gleichwertig mit dem ursprünglichen Export.

Die zusätzliche Quantisierung und das Prompting ersetzen kein Training. Vor einer Integration sind gezieltes Fine-Tuning für deutsche Frageformulierung, getrennte Evaluationsspiele und eine strengere Bedeutungs-/Fragetypprüfung nötig. Kein solches Fine-Tuning wurde hier durchgeführt. Gemma ist ein Kandidat für diese Weiterentwicklung, kein fertiger Ersatz.

## Reproduktion

```bash
npm start
# In einem zweiten Terminal:
node scripts/evaluate-small-language-models.mjs
npm install --prefix artifacts/wllama-probe @wllama/wllama@3.6.1 @wllama/wllama-compat@3.6.1
node scripts/evaluate-gemma-browser.mjs
node scripts/evaluate-gemma-browser.mjs --webkit
```

Die Browser-Probe benötigt installierte Playwright-Browser und Systembibliotheken. Sie lädt den gepinnten Gemma-Export nach `artifacts/model-candidates/` und prüft dessen SHA256 gegen die Metadaten. Es gibt keine entfernte Inferenz. Das Spiel selbst startet dieses Testmodell nicht.

Für die zusätzliche Quantisierung wurde das offizielle Linux-x64-Release von [llama.cpp b11146](https://github.com/ggml-org/llama.cpp/releases/tag/b11146) verwendet:

```bash
artifacts/llama-quantizer/llama-b11146/llama-quantize \
  --allow-requantize --token-embedding-type q4_0 \
  artifacts/model-candidates/gemma-270m.gguf \
  artifacts/model-candidates/gemma-270m-small.gguf Q4_0 2
node scripts/evaluate-gemma-browser.mjs --smaller
node scripts/evaluate-gemma-browser.mjs --smaller --webkit
# Weitere geprüfte Anweisungen:
node scripts/evaluate-gemma-browser.mjs --smaller --german
node scripts/evaluate-gemma-browser.mjs --smaller --few-shot
```

Ausgangs-SHA256: `3626e245220ca4a1c5911eb4010b3ecb7bdbf5bc53c79403c21355354d1e2dc6`.
Requantisierungs-SHA256: `4b1961708d296e757440b72448b7e67aa8d451973e364637bf94cb8bfdd5afc1`.
Die heruntergeladenen Testgewichte und Diagnosepakete sind ignorierte Artefakte, keine neuen Produktionsabhängigkeiten oder Git-Assets.

## Gepinnte Quellen und Grenzen

- [FLAN-T5-small](https://huggingface.co/google/flan-t5-small): Apache 2.0; ONNX-Export `Xenova/flan-t5-small`, Revision `311454e83bc784267fd7eef5940ee854144abbec`.
- [SmolLM2-135M-Instruct](https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct): Apache 2.0; ONNX-Export `onnx-community/SmolLM2-135M-Instruct-ONNX`, Revision `b8a5c0f183b78c55955a5364f610c36668b5e681`.
- [Gemma 3 270M](https://developers.googleblog.com/en/introducing-gemma-3-270m/): von Google ausdrücklich für spezialisierte Aufgaben/Fine-Tuning vorgesehen. [GGUF-Export](https://huggingface.co/ggml-org/gemma-3-270m-it-qat-GGUF), Revision `7dba9faa7cdb58c7dc44b238c7dbb00e391fbf65`, Datei `gemma-3-270m-it-qat-Q4_0.gguf`.
- Gemma hat eigene [Nutzungs- und Weitergabebedingungen](https://ai.google.dev/gemma/terms), keine Apache-/MIT-Lizenz. Vor Veröffentlichung der Gewichte sind diese Bedingungen einschließlich der Hinweise für veränderte Modelle zu berücksichtigen.
- [wllama](https://github.com/ngxson/wllama): CPU-WASM; für WebKit wurde die kompatible Asyncify-/32-bit-Laufzeit eingerichtet. Ein Thread vermeidet eine Pflicht zu Cross-Origin-Isolation/SharedArrayBuffer.
- [CrazyGames](https://docs.crazygames.com/requirements/technical/): maximal 250 MB Paket, höchstens 50 MB initialer Download beziehungsweise 20 MB für die mobile Startseite. Der erste Gameplay-Start darf erst im tatsächlich spielbaren Zustand gemeldet werden. Externe Dateien werden nach höchstens 20 Sekunden bis zum Gameplay bewertet. Auch 158 MB Gewichte alleine erfüllen daher die Startanforderung noch nicht; ein kleineres Gesamtpaket ist keine Zulassungszusage.
