import type { CommentRefType, CommentType } from '@/prisma/enums';

// A commenter as comments show them (Earn's author select).
export interface CommentAuthor {
  readonly id?: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly photo: string | null;
  readonly username: string | null;
  readonly currentSponsorId: string | null;
}

// Someone the mention box can suggest: a commenter, the listing's poc, or a
// search result.
export interface MentionUser {
  readonly id?: string;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly username?: string | null;
  readonly photo?: string | null;
}

// A comment as the comment routes answer and pages pass it down, dates as
// ISO strings. Top-level comments carry their replies; replies don't nest.
export interface Comment {
  readonly id: string;
  readonly message: string;
  readonly authorId: string;
  readonly refType: CommentRefType;
  readonly refId: string;
  readonly isPinned: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly replyToId: string | null;
  readonly submissionId: string | null;
  readonly type: CommentType;
  readonly author: CommentAuthor;
  readonly replies?: ReadonlyArray<Comment>;
}

// One page of a thing's comments: Earn's GET /api/comment/[id] answer.
export interface CommentsPage {
  readonly count: number;
  readonly result: ReadonlyArray<Comment>;
  readonly validUsernames: ReadonlyArray<string>;
}
