import type { NextApiRequest, NextApiResponse } from 'next';

const LISTING_ID = 'bcd4dda6-587e-4a63-8b42-b2096a48fc92';
const CONCURRENT_REQUESTS = 5;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const baseUrl = 'http://localhost:3000';

  const announceUrl = `${baseUrl}/api/sponsor-dashboard/listing/${LISTING_ID}/announce`;

  console.log(
    `\n🚀 Starting concurrent test with ${CONCURRENT_REQUESTS} requests`,
  );
  console.log(`Target URL: ${announceUrl}\n`);

  const cookies = req.headers.cookie || '';

  const requests = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) => {
    return fetch(announceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies,
      },
    })
      .then(async (response) => {
        const text = await response.text();
        let body;
        try {
          body = JSON.parse(text);
        } catch {
          body = { raw: text };
        }

        console.log(
          `Request ${i + 1}: Status ${response.status} - ${JSON.stringify(body)}`,
        );

        return {
          index: i + 1,
          status: response.status,
          ok: response.ok,
          body,
        };
      })
      .catch((error) => {
        console.error(`Request ${i + 1} failed:`, error.message);
        return {
          index: i + 1,
          status: 0,
          ok: false,
          error: error.message,
        };
      });
  });

  const results = await Promise.all(requests);

  const successCount = results.filter((r) => r.ok).length;
  const conflictCount = results.filter((r) => r.status === 409).length;
  const errorCount = results.filter((r) => !r.ok && r.status !== 409).length;

  console.log(`\n📊 Results:`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`🔒 Conflicts (409): ${conflictCount}`);
  console.log(`❌ Errors: ${errorCount}\n`);

  return res.status(200).json({
    summary: {
      total: CONCURRENT_REQUESTS,
      success: successCount,
      conflicts: conflictCount,
      errors: errorCount,
    },
    results,
  });
}
