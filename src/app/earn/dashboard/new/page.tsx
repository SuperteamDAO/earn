import { BuilderPage, builderMetadata } from './builder-page';

export const metadata = builderMetadata;

export default async function NewListing({
  searchParams,
}: PageProps<'/earn/dashboard/new'>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of [value ?? []].flat()) query.append(key, item);
  }
  const search = query.toString();
  return (
    <BuilderPage
      route="new"
      slug={null}
      here={`/earn/dashboard/new/${search ? `?${search}` : ''}`}
    />
  );
}
