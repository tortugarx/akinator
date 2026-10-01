// Static model-file transport only. Never sends prompts or answers.
// Some hosts/browsers ignore Range and return 200 with the entire file.
// Keep ONE streaming response in that case, not one full download per shard.
export class ModelDownloader {
  constructor(sourceUrl,fetchFile = globalThis.fetch.bind(globalThis)) {
    this.sourceUrl = sourceUrl;
    this.fetchFile = fetchFile;
    this.position = 0;
    this.pending = new Uint8Array(0);
    this.reader = null;
  }

  async consume(length,keep = true) {
    const output = keep ? new Uint8Array(length) : null;
    let used = 0;
    while (used < length) {
      if (!this.pending.length) {
        const {value,done} = await this.reader.read();
        if (done) throw Error('Der Modelldownload wurde vorzeitig beendet. Bitte erneut versuchen.');
        this.pending = value;
      }
      const count = Math.min(length-used,this.pending.length);
      if (keep) output.set(this.pending.subarray(0,count),used);
      this.pending = this.pending.subarray(count);
      used += count;
      this.position += count;
    }
    return output?.buffer;
  }

  async chunk(chunk) {
    if (!this.reader) {
      const response = await this.fetchFile(this.sourceUrl,{
        headers:{Range:`bytes=${chunk.offset}-${chunk.offset+chunk.size-1}`},
        cache:'no-store',credentials:'omit'
      });
      if (response.status === 206) return response.arrayBuffer();
      if (response.status !== 200 || !response.body) {
        throw Error(`Der Modellhost ist nicht verfügbar (HTTP ${response.status}). Bitte erneut versuchen.`);
      }
      this.reader = response.body.getReader();
    }
    if (chunk.offset < this.position) throw Error('Ungültige Reihenfolge der Modellteile.');
    await this.consume(chunk.offset-this.position,false);
    return this.consume(chunk.size);
  }

  async close() {
    try { await this.reader?.cancel(); } catch { /* Network can already be closed. */ }
    this.reader = null;
    this.pending = new Uint8Array(0);
  }
}
