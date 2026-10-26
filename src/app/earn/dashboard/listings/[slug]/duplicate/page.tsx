import { BuilderPage, builderMetadata } from '../../../new/builder-page';

export const metadata = builderMetadata;

export default async function DuplicateListing({
  params,
}: PageProps<'/earn/dashboard/listings/[slug]/duplicate'>) {
  const { slug } = await params;
  return (
    <BuilderPage
      route="duplicate"
      slug={slug}
      here={`/earn/dashboard/listings/${encodeURIComponent(slug)}/duplicate/`}
    />
  );
}
