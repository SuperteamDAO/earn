async function delay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), milliseconds);
  });
}

export async function rateLimitedPromiseAll<T>(
  items: T[],
  chunkSize: number,
  callback: (item: T) => Promise<any>,
) {
  const results: any[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await Promise.all(chunk.map(callback)).then((result) =>
      results.push(...result),
    );
    if (i + chunkSize < items.length) {
      await delay(1000);
    }
  }

  return results;
}
