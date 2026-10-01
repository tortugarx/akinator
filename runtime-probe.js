// A one-float ONNX Identity graph. No person data or model downloads.
const model = new Uint8Array([8,8,58,67,10,16,10,1,120,18,1,121,34,8,73,100,101,110,116,105,116,121,18,13,114,117,110,116,105,109,101,45,112,114,111,98,101,90,15,10,1,120,18,10,10,8,8,1,18,4,10,2,8,1,98,15,10,1,121,18,10,10,8,8,1,18,4,10,2,8,1,66,2,16,13]);

export async function checkRuntime(backend,device) {
  const session = await backend.InferenceSession.create(model,{executionProviders:[device]});
  try {
    const output = await session.run({x:new backend.Tensor('float32',new Float32Array([3]),[1])});
    if (output.y.data[0] !== 3) throw Error('Die lokale KI-Laufzeit liefert ein ungültiges Testergebnis.');
    return output.y.data[0];
  } finally { await session.release(); }
}
