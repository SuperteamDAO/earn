export async function GET() {
  if (process.env.IS_LOCAL === 'true') {
    try {
      const response = await fetch('https://httpbin.org/get', {
        method: 'HEAD',
        headers: {
          Accept: 'application/json',
        },
      });
      console.log('Response:', response);

      if (!response.ok) {
        throw new Error('Failed to fetch external time');
      }

      // Get the current time from the response headers
      const dateHeader = response.headers.get('date');
      console.log('Date header:', dateHeader);
      if (!dateHeader) {
        throw new Error('No date header in response');
      }

      const externalTime = new Date(dateHeader).getTime();

      console.log('External time:', externalTime);
      console.log('New Date:', new Date(externalTime).toISOString());
      return Response.json({
        timestamp: externalTime,
        iso: new Date(externalTime).toISOString(),
        timezone: 'UTC',
      });
    } catch (error) {
      console.error(
        'External time service failed, falling back to system time:',
        error,
      );
      // Fallback to system time if external service fails
      return Response.json({
        timestamp: Date.now(),
        iso: new Date().toISOString(),
        timezone: process.env.TZ || 'UTC',
      });
    }
  } else {
    // Use system time in prod
    return Response.json({
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      timezone: process.env.TZ || 'UTC',
    });
  }
}
