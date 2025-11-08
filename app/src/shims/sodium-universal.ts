// Lightweight shim for sodium-universal in browser/Next.js environments.
// The WDK only calls sodium_memzero to wipe sensitive buffers, so we provide a
// minimal implementation that zeroes out the given ArrayBuffer view.

export function sodium_memzero(buffer: ArrayBufferView | ArrayBuffer | undefined | null): void {
  if (!buffer) return;

  if (buffer instanceof ArrayBuffer) {
    new Uint8Array(buffer).fill(0);
    return;
  }

  const view = buffer as ArrayBufferView;
  if (typeof (view as Uint8Array).fill === "function") {
    (view as Uint8Array).fill(0);
    return;
  }

  const arrayBuffer = view.buffer;
  if (arrayBuffer) {
    new Uint8Array(arrayBuffer, view.byteOffset, view.byteLength).fill(0);
  }
}

const sodiumUniversalShim = { sodium_memzero };
export default sodiumUniversalShim;
