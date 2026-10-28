import Head from 'next/head';

interface JsonLdProps {
  readonly data: object | object[];
}

/**
 * Component to inject JSON-LD structured data into the page head
 * Supports single schema or array of schemas
 */
export function JsonLd({ data }: JsonLdProps) {
  const jsonLdArray = Array.isArray(data) ? data : [data];

  const serializeJsonLd = (schema: object) =>
    JSON.stringify(schema, null, 0).replace(/</g, '\\u003c');

  return (
    <Head>
      {jsonLdArray.map((schema, index) => (
        <script
          // react-doctor-disable-next-line react-doctor/no-array-index-as-key -- schemas are a fixed per-page array that never reorders, and next/head uses this key to dedupe tags
          key={`json-ld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(schema),
          }}
        />
      ))}
    </Head>
  );
}
