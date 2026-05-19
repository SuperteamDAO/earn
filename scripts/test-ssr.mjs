/**
 * SSR Homepage Listings Test
 * Run with: node scripts/test-ssr.mjs
 * Make sure the dev server is running on localhost:3000
 */

const URL = 'http://localhost:3000/earn';

async function testSSR() {
  console.log('🔍 Testing SSR on:', URL);
  console.log('─'.repeat(50));

  const start = Date.now();
  let html;

  try {
    const res = await fetch(URL, {
      headers: {
        // No cookies = anonymous user = SSR should kick in
        'User-Agent': 'SSR-Test-Bot/1.0',
      },
    });

    const ttfb = Date.now() - start;
    html = await res.text();
    const total = Date.now() - start;

    console.log(`✅ Page loaded (status: ${res.status})`);
    console.log(`⏱  TTFB: ~${ttfb}ms | Total: ${total}ms`);
    console.log('─'.repeat(50));

    // 1. Check if __NEXT_DATA__ contains initialListings
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!nextDataMatch) {
      console.log('❌ Could not find __NEXT_DATA__ — something is very wrong');
      return;
    }

    const nextData = JSON.parse(nextDataMatch[1]);
    const props = nextData?.props?.pageProps;

    console.log('\n📦 NEXT_DATA pageProps:');
    console.log(`  potentialSession: ${props?.potentialSession}`);
    console.log(`  ssrTimestamp:     ${props?.ssrTimestamp ?? 'null'}`);

    const listings = props?.initialListings;

    if (!listings || listings.length === 0) {
      console.log('  initialListings:  null or empty');
      console.log('\n⚠️  SSR RESULT: No listings were server-rendered.');
      if (props?.potentialSession) {
        console.log('   Reason: user-id-hint cookie detected → SSR skipped (expected for logged-in users)');
      } else {
        console.log('   Reason: DB query may have failed or returned 0 results');
      }
      return;
    }

    console.log(`  initialListings:  ${listings.length} listings ✅`);

    // 2. Check if listing titles appear in the raw HTML
    console.log('\n🔎 Checking if listing titles appear in raw HTML:');
    let foundInHtml = 0;
    for (const listing of listings.slice(0, 5)) {
      const title = listing.title;
      if (!title) continue;
      // Escape for search (strip special chars)
      const safeTitle = title.slice(0, 20);
      const inHtml = html.includes(safeTitle);
      console.log(`  ${inHtml ? '✅' : '❌'} "${safeTitle}..."`);
      if (inHtml) foundInHtml++;
    }

    // 3. Summary
    console.log('\n─'.repeat(50));
    if (foundInHtml > 0) {
      console.log(`✅ SSR IS WORKING — ${listings.length} listings in data, ${foundInHtml}/5 titles found in raw HTML`);
      console.log('   Search engines will see the listing content without JavaScript.');
    } else {
      console.log('❌ SSR DATA IS THERE but titles not found in raw HTML');
      console.log('   The listings are in __NEXT_DATA__ but may not be pre-rendered to HTML.');
      console.log('   Check if the component is rendering initialListings correctly.');
    }

    // 4. Performance note
    const dbTime = Date.now() - start - (Date.now() - start);
    console.log(`\n⚡ Performance: Page response took ${Date.now() - start}ms total`);
    if (Date.now() - start > 3000) {
      console.log('   ⚠️  Response is slow (>3s). DB query may need optimization.');
    } else {
      console.log('   Response time looks healthy.');
    }

  } catch (err) {
    console.log('❌ Failed to fetch page:', err.message);
    console.log('   Is the dev server running? Try: pnpm dev');
  }
}

testSSR();
