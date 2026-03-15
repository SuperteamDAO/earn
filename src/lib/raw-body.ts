const DEFAULT_BODY_LIMIT_BYTES = 1024 * 1024;

export async function readRawBody(
  req: AsyncIterable<Uint8Array>,
  limitBytes: number = DEFAULT_BODY_LIMIT_BYTES,
) {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;

    if (totalBytes > limitBytes) {
      throw new Error('Request body too large');
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}
