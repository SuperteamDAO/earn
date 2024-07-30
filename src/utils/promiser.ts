interface PromiseError {
  error: any;
  message: string;
}
async function promiser<T>(
  promise: Promise<T>,
): Promise<[T, null] | [null, PromiseError]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error: any & { message: string }) {
    return [
      null,
      {
        error,
        message: error.message ?? 'Some Error has occured',
      },
    ];
  }
}

export default promiser;

export async function PromiserJson<T>(
  promise: Promise<Response>,
): Promise<[T, null] | [null, PromiseError]> {
  const [responseData, responseError] = await promiser(promise);

  if (responseError) {
    return [null, responseError];
  }
  const [parsedData, parsedError] = await promiser<T>(responseData.json());
  if (parsedError) {
    return [null, parsedError];
  }
  if (!parsedData) {
    return [null, { message: 'Empty data', error: 'Empty data' }];
  }
  if (!responseData.ok) {
    console.log(parsedData);
    return [null, { message: 'Response not ok', error: parsedData }];
  }
  return [parsedData, null];
}
