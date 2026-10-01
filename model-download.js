// Static model-file transport only. Never sends prompts or answers.
// Some hosts/browsers ignore Range and return 200 with the entire file.
// Keep ONE streaming response in that case, not one full download per shard.
export function withDeadline(operation,timeoutMs,onTimeout = () => {}) {
  let timer;
  return Promise.race([Promise.resolve(operation),new Promise((resolve,reject)=>{
    timer = setTimeout(()=>{
      reject(Error('Der Modelldownload reagiert seit längerer Zeit nicht. Bitte erneut versuchen; gespeicherte Teile bleiben erhalten.'));
      onTimeout();
    },timeoutMs);
  })]).finally(()=>clearTimeout(timer));
}

export class ModelDownloader {
  constructor(sourceUrl,fetchFile = globalThis.fetch.bind(globalThis),{onProgress = () => {},idleTimeoutMs = 45000} = {}) {
    this.sourceUrl = sourceUrl;
    this.fetchFile = fetchFile;
    this.position = 0;
    this.pending = new Uint8Array(0);
    this.reader = null;
    this.abort = null;
    this.onProgress = onProgress;
    this.idleTimeoutMs = idleTimeoutMs;
  }

  async consume(length,keep = true) {
    const output = keep ? new Uint8Array(length) : null;
    let used = 0;
    while (used < length) {
      if (!this.pending.length) {
        const {value,done} = await withDeadline(this.reader.read(),this.idleTimeoutMs,()=>this.close());
        if (done) throw Error('Der Modelldownload wurde vorzeitig beendet. Bitte erneut versuchen.');
        this.pending = value;
      }
      const count = Math.min(length-used,this.pending.length);
      if (keep) output.set(this.pending.subarray(0,count),used);
      this.pending = this.pending.subarray(count);
      used += count;
      this.position += count;
      if (keep) this.onProgress(this.position);
    }
    return output?.buffer;
  }

  async chunk(chunk) {
    if (!this.reader) {
      this.abort = new AbortController();
      const response = await withDeadline(this.fetchFile(this.sourceUrl,{
        headers:{Range:`bytes=${chunk.offset}-${chunk.offset+chunk.size-1}`},
        cache:'no-store',credentials:'omit',signal:this.abort.signal
      }),this.idleTimeoutMs,()=>this.close());
      if (response.status === 206 && response.body) {
        this.reader = response.body.getReader();
        this.position = chunk.offset;
        try { return await this.consume(chunk.size); }
        finally { await this.close(); }
      }
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
    this.abort?.abort();
    this.abort = null;
    try { this.reader?.cancel().catch(()=>{}); } catch { /* Network can already be closed. */ }
    this.reader = null;
    this.position = 0;
    this.pending = new Uint8Array(0);
  }
}
