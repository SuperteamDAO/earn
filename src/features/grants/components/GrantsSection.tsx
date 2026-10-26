import 'server-only';

import * as Effect from 'effect/Effect';

import { getViewer } from '@/lib/session';
import * as GrantLists from '@/server/grant-lists';
import { runtime } from '@/server/runtime';

import { GrantsSectionView } from './GrantsSectionView';

type SearchParams = Readonly<Record<string, string | string[] | undefined>>;

interface GrantSectionProps {
  readonly type: GrantLists.GrantListQuery['context'];
  // This page's search params (`grantCategory`).
  readonly searchParams?: SearchParams;
  readonly region?: string;
  readonly sponsor?: string;
  readonly category?: string;
  readonly hideWhenEmpty?: boolean;
  readonly hideCategoryPills?: boolean;
}

// Earn's Grants list, rendered on the server for this page's category.
export async function GrantsSection({
  type,
  searchParams = {},
  region,
  sponsor,
  category: categoryProp,
  hideWhenEmpty,
  hideCategoryPills,
}: GrantSectionProps) {
  const param = searchParams.grantCategory;
  const activeCategory = GrantLists.asGrantCategory(
    Array.isArray(param) ? param[0] : param,
  );
  // For category contexts, use the category prop (route category)
  // For other contexts, use activeCategory (filter selection)
  const effectiveCategory =
    type === 'category' && categoryProp
      ? GrantLists.asGrantCategory(categoryProp)
      : activeCategory;

  const viewer = await getViewer();
  const grants = await runtime.runPromise(
    GrantLists.GrantLists.use((lists) =>
      lists.list(
        {
          context: type,
          category: effectiveCategory,
          ...(region ? { region } : {}),
          ...(sponsor ? { sponsor } : {}),
        },
        viewer,
      ),
    ).pipe(Effect.orElseSucceed(() => null)),
  );

  if (hideWhenEmpty && !grants?.length) return null;

  return (
    <GrantsSectionView
      type={type}
      grants={grants}
      category={activeCategory}
      hideCategoryPills={hideCategoryPills}
    />
  );
}
