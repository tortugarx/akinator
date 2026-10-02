export async function readKnowledge(response, compressed=false) {
  if (!response.ok) throw Error('Knowledge base unavailable');
  if (!compressed) return response.json();
  if (!globalThis.DecompressionStream) throw Error('Compressed knowledge unsupported');
  const stream=response.body.pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).json();
}
