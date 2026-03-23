import { isEligiblePeopleType } from './peopleEligibility';

type MembershipUser<TChapter = unknown> =
  | {
      membershipType?: string | null;
      chapterId?: string | null;
      chapter?: TChapter | null;
      people?: {
        type?: string | null;
        chapterId?: string | null;
        chapter?: TChapter | null;
      } | null;
    }
  | null
  | undefined;

function normalizeMembershipType(type: string | null | undefined) {
  const normalized = type?.trim().toLowerCase();
  return normalized || null;
}

function normalizeNonEmpty(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || null;
}

export function resolveUserMembershipType<TChapter = unknown>(
  user: MembershipUser<TChapter>,
) {
  return (
    normalizeMembershipType(user?.membershipType) ??
    normalizeMembershipType(user?.people?.type)
  );
}

export function hasEligibleUserMembership<TChapter = unknown>(
  user: MembershipUser<TChapter>,
) {
  return isEligiblePeopleType(resolveUserMembershipType(user));
}

export function isUserCoreMember<TChapter = unknown>(
  user: MembershipUser<TChapter>,
) {
  return resolveUserMembershipType(user) === 'core';
}

export function resolveUserMembershipChapterId<
  TChapter = { id?: string | null },
>(user: MembershipUser<TChapter>) {
  return (
    normalizeNonEmpty(user?.chapterId) ??
    normalizeNonEmpty((user?.chapter as { id?: string | null } | null)?.id) ??
    normalizeNonEmpty(user?.people?.chapterId) ??
    normalizeNonEmpty(
      (user?.people?.chapter as { id?: string | null } | null)?.id,
    )
  );
}

export function resolveUserMembershipChapter<TChapter>(
  user:
    | {
        chapter?: TChapter | null;
        people?: {
          chapter?: TChapter | null;
        } | null;
      }
    | null
    | undefined,
) {
  return user?.chapter ?? user?.people?.chapter ?? null;
}
