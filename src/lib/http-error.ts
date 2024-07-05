interface HttpErrorOptions<TCode extends number = number> {
  url?: string;
  method?: string;
  message?: string;
  statusCode: TCode;
  cause?: Error;
}

interface HttpError<TCode extends number = number> {
  cause?: Error;
  statusCode: TCode;
  message: string;
  url?: string;
  method?: string;
  name: string;
  stack?: string;
}

function createHttpError<TCode extends number = number>(
  opts: HttpErrorOptions<TCode>,
): HttpError<TCode> {
  const message = opts.message ?? `HTTP Error ${opts.statusCode}`;
  const error: HttpError<TCode> = {
    name: 'HttpError',
    statusCode: opts.statusCode,
    message,
    url: opts.url,
    method: opts.method,
    cause: opts.cause,
    stack: opts.cause?.stack,
  };

  return error;
}

function httpErrorFromRequest(
  request: Request,
  response: Response,
): HttpError<number> {
  return createHttpError({
    message: response.statusText,
    url: request.url,
    method: request.method,
    statusCode: response.status,
  });
}

export { httpErrorFromRequest };

// usage example
// const error = createHttpError({ statusCode: 404, message: 'Not Found' });
// console.log(error);

// const request = new Request('https://example.com', { method: 'GET' });
// const response = new Response(null, { status: 404, statusText: 'Not Found' });
// const errorFromRequest = httpErrorFromRequest(request, response);
// console.log(errorFromRequest);
