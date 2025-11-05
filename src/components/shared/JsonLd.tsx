import Head from 'next/head';

interface JsonLdProps {
  readonly data: Record<string, any> | Record<string, any>[];
}

/**
 * Component to inject JSON-LD structured data into the page head
 * Supports single schema or array of schemas
 */
export function JsonLd({ data }: JsonLdProps) {
  const jsonLdArray = Array.isArray(data) ? data : [data];

  return (
    <Head>
      {jsonLdArray.map((schema, index) => (
        <script
          key={`json-ld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 0),
          }}
        />
      ))}
    </Head>
  );
}
