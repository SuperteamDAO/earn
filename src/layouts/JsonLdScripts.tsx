// Earn's <JsonLd> for App Router pages: the scripts render in the body,
// where search engines read them as well, with `<` escaped.
export function JsonLdScripts({
  data,
}: {
  readonly data: ReadonlyArray<object>;
}) {
  return (
    <>
      {data.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          // oxlint-disable-next-line react/no-danger -- JSON-LD, `<` escaped
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  );
}
