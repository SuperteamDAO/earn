import 'server-only';

import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import * as Database from '@/server/database';

// A project as Earn's forms send it.
export const Project = Schema.Struct({
  id: Schema.optional(Schema.String),
  title: Schema.String,
  description: Schema.String,
  skills: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  subSkills: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  link: Schema.String,
  createdAt: Schema.optional(Schema.String),
});
export type Project = typeof Project.Type;

export class ProjectsRefused extends Schema.TaggedError<ProjectsRefused>()(
  'ProjectsRefused',
  { errors: Schema.Array(Schema.String) },
) {
  override get message() {
    return `Projects refused: ${this.errors.join(', ')}`;
  }
}

export class LikeTargetMissing extends Schema.TaggedError<LikeTargetMissing>()(
  'LikeTargetMissing',
  {},
) {
  override get message() {
    return 'Nothing to like';
  }
}

// Earn's likes on a post: who, and when (ms). earn-emails reads the dates
// for its daily "new likes" email, so their shape is a contract.
const Likes = Schema.Array(
  Schema.Struct({ id: Schema.String, date: Schema.Finite }),
);

export class ProofOfWork extends Context.Service<
  ProofOfWork,
  {
    // Adds projects (Earn's /api/pow/create).
    readonly create: (
      userId: string,
      projects: ReadonlyArray<Project>,
    ) => Effect.Effect<void, Database.DatabaseError>;
    // Makes their projects exactly these (Earn's /api/pow/edit): sent ids
    // update, new ones are made, the rest are deleted.
    readonly replace: (
      userId: string,
      projects: ReadonlyArray<Project>,
    ) => Effect.Effect<void, ProjectsRefused | Database.DatabaseError>;
    // Likes a project, or takes the like back (Earn's updateLike).
    readonly toggleLike: (
      userId: string,
      projectId: string,
    ) => Effect.Effect<
      { readonly liked: boolean },
      LikeTargetMissing | Database.DatabaseError
    >;
  }
>()('earn/ProofOfWork') {}

const dateOf = (value: string | undefined) => {
  if (value === undefined) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const fields = (project: Project) => ({
  title: project.title,
  description: project.description,
  skills: project.skills ? [...project.skills] : undefined,
  subSkills: project.subSkills ? [...project.subSkills] : undefined,
  link: project.link,
  createdAt: dateOf(project.createdAt),
});

const make = Effect.gen(function* () {
  const database = yield* Database.Database;

  const create = Effect.fn('ProofOfWork.create')(function* (
    userId: string,
    projects: ReadonlyArray<Project>,
  ) {
    yield* database.query('createProjects', (client) =>
      client.poW.createMany({
        data: projects.map((project) => ({ ...fields(project), userId })),
        skipDuplicates: true,
      }),
    );
  });

  const replace = Effect.fn('ProofOfWork.replace')(function* (
    userId: string,
    projects: ReadonlyArray<Project>,
  ) {
    const existing = yield* database.query('ownProjects', (client) =>
      client.poW.findMany({ where: { userId }, select: { id: true } }),
    );
    const ownIds = new Set(existing.map((row) => row.id));
    const foreign = projects.flatMap((project) =>
      project.id && !ownIds.has(project.id)
        ? [`PoW with id ${project.id} does not belong to user ${userId}`]
        : [],
    );
    if (foreign.length > 0) {
      return yield* new ProjectsRefused({ errors: foreign });
    }
    const keep = new Set(projects.flatMap((project) => project.id ?? []));
    const remove = [...ownIds].filter((id) => !keep.has(id));
    const added = projects.filter((project) => !project.id);
    const updated = projects.filter((project) => project.id);

    yield* database.query('replaceProjects', (client) =>
      client.$transaction(async (tx) => {
        if (remove.length > 0) {
          await tx.poW.deleteMany({ where: { userId, id: { in: remove } } });
        }
        if (added.length > 0) {
          await tx.poW.createMany({
            data: added.map((project) => ({ ...fields(project), userId })),
          });
        }
        for (const project of updated) {
          await tx.poW.update({
            where: { id: project.id },
            data: fields(project),
          });
        }
      }),
    );
    return yield* Effect.void;
  });

  const toggleLike = Effect.fn('ProofOfWork.toggleLike')(function* (
    userId: string,
    projectId: string,
  ) {
    const now = yield* Clock.currentTimeMillis;
    const result = yield* database.query('toggleProjectLike', (client) =>
      client.$transaction(async (tx) => {
        const project = await tx.poW.findUnique({
          where: { id: projectId },
          select: { like: true },
        });
        if (!project) return null;
        const likes = Schema.decodeUnknownOption(Likes)(project.like).pipe(
          Option.getOrElse(
            (): ReadonlyArray<{ id: string; date: number }> => [],
          ),
        );
        const liked = !likes.some((like) => like.id === userId);
        const next = liked
          ? [...likes, { id: userId, date: now }]
          : likes.filter((like) => like.id !== userId);
        await tx.poW.update({
          where: { id: projectId },
          data: { like: next, likeCount: next.length },
        });
        return { liked };
      }),
    );
    if (!result) return yield* new LikeTargetMissing();
    return result;
  });

  return ProofOfWork.of({ create, replace, toggleLike });
});

export const layer = Layer.effect(ProofOfWork, make);
