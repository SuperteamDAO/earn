import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

function flattenSubSkills(skillsArray: any[]): string[] {
  const flattenedSubSkills: string[] = [];

  for (const skillObj of skillsArray) {
    flattenedSubSkills.push(...skillObj.subskills);
  }

  return flattenedSubSkills;
}

function flattenSkills(skillsArray: any[]): string[] {
  const flattenedSubSkills: string[] = [];

  for (const skillObj of skillsArray) {
    flattenedSubSkills.push(skillObj.skills);
  }

  return flattenedSubSkills;
}

function filterInDevSkills(skills: string[]) {
  const devSkills = ['Frontend', 'Backend', 'Blockchain', 'Mobile'];
  return skills.filter((s) => devSkills.includes(s));
}

function subskillContainQuery(subskills: string[], alias: string) {
  return subskills.map(
    (subskill) =>
      `JSON_CONTAINS(JSON_EXTRACT(${alias}.skills, '$[*].subskills'), JSON_QUOTE('${subskill}'))`,
  );
}

function skillContainQuery(skills: string[], alias: string) {
  return skills.map(
    (subskill) =>
      `JSON_CONTAINS(JSON_EXTRACT(${alias}.skills, '$[*].skills'), JSON_QUOTE('${subskill}'))`,
  );
}

async function scoutTalent(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;
  const id = params.id as string;
  const LIMIT = 10;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    logger.debug(`Fetching bounty with ID: ${id}`);
    const scoutBounty = await prisma.bounties.findFirst({
      where: {
        id,
      },
    });
    if (scoutBounty === null) {
      logger.warn(`Bounty with ID: ${id} not found`);
      return res.status(404).send('Bounty Not Found');
    }

    const scoutSponsor = await prisma.sponsors.findFirst({
      where: {
        id: scoutBounty.sponsorId,
      },
    });

    if (scoutSponsor?.isVerified === false) {
      logger.warn(`Sponsor isnt Verified, not sending scout data`);
      return res.status(200).send([]);
    }

    const userId = req.userId;
    logger.debug(`Fetching user details for user ID: ${userId}`);
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (scoutBounty?.sponsorId !== user?.currentSponsorId) {
      logger.warn(
        `User ID: ${userId} is not authorized to generate scouts for bounty ID: ${id}`,
      );
      return res
        .status(403)
        .send(`Bounty doesn't belong to requesting sponsor`);
    }

    if ((scoutBounty.skills as any)?.[0].subskills === null) {
      logger.warn('Bounty has no skills');
      return res.status(404).send('Bounty has No skills');
    }

    const subskills = flattenSubSkills(scoutBounty.skills as any);
    const devSkills = filterInDevSkills(
      flattenSkills(scoutBounty.skills as any),
    );
    const region = scoutBounty.region.toString();

    logger.debug('Fetching previous scouts');
    const prevScouts = await prisma.scouts.findMany({
      where: {
        listingId: id,
      },
      orderBy: {
        score: 'desc',
      },
      include: {
        user: true,
      },
    });

    if (prevScouts[0]) {
      const createdAtDayjs = dayjs(prevScouts[0].createdAt);
      const nowDayjs = dayjs(new Date());
      const hourDiff = nowDayjs.diff(createdAtDayjs, 'hour');
      if (hourDiff <= 6) {
        logger.info(
          'Returning previous scouts as they were generated within the last 6 hours',
        );
        return res.send(prevScouts);
      }
    }

    if (prevScouts.length > 0) {
      logger.debug('Deleting previous scouts');
      await prisma.scouts.deleteMany({
        where: {
          listingId: id,
        },
      });
    }

    const sumMatchingSubSkillsQuery = `
      SUM(
        ${
          subskills.length > 0
            ? `
          ${subskillContainQuery(subskills, 'bs')
            .map(
              (s) => `
                (CASE WHEN ${s} THEN 1 ELSE 0 END)
              `,
            )
            .join(' + ')}
        `
            : `0 + 0`
        }
	    ) AS matchingSubSkills
    `;

    const sumMatchingSkillsQuery = `
      SUM(
        ${
          devSkills.length > 0
            ? `
          ${skillContainQuery(devSkills, 'bs')
            .map(
              (s) => `
                (CASE WHEN ${s} THEN 1 ELSE 0 END)
              `,
            )
            .join(' + ')}
        `
            : `0 + 0`
        }
	    ) AS matchingSkills
    `;

    const arrayMatchingSkillsCaseConditionQuery = (
      subskills: string[],
      skills: string[],
      alias: string,
    ) => `
      CONCAT('[',
        GROUP_CONCAT(DISTINCT
          CONCAT_WS(',',
          ${
            subskills.length > 0
              ? subskills
                  .map(
                    (s) => `
                CASE
                  WHEN JSON_CONTAINS(JSON_EXTRACT(${alias}.skills, '$[*].subskills'), JSON_QUOTE('${s}')) THEN JSON_QUOTE('${s}')
                  ELSE NULL
                END
              `,
                  )
                  .join(`, \n`)
              : ''
          }
      ${skills.length > 0 && subskills.length > 0 ? ',' : ''}
        ${
          skills.length > 0
            ? skills
                .map(
                  (s) => `
                  CASE
                    WHEN JSON_CONTAINS(JSON_EXTRACT(${alias}.skills, '$[*].skills'), JSON_QUOTE('${s}')) THEN JSON_QUOTE('${s}')
                    ELSE NULL
                  END
                `,
                )
                .join(`, \n`)
            : ''
        }
        )
        ),
        ']') AS matchedSkillsArray
      `;

    const matchingWhereClause = (
      subskills: string[],
      skills: string[],
      alias: string,
    ) => {
      let matchingArray: string[] = [];
      if (subskills.length > 0)
        matchingArray = matchingArray.concat(
          subskillContainQuery(subskills, alias),
        );
      if (skills.length > 0)
        matchingArray = matchingArray.concat(skillContainQuery(skills, alias));
      return matchingArray;
    };

    const userWithMatchingSubmissionsQuery = (
      sumMatchingSkills: boolean = false,
      arrayMatchingSkills: boolean = false,
    ) => `
      SELECT
        u.id as userId,
        SUM(s.rewardInUSD) as dollarsEarned
        ${sumMatchingSkills ? ',' + sumMatchingSubSkillsQuery : ''}
        ${sumMatchingSkills ? ',' + sumMatchingSkillsQuery : ''}
        ${arrayMatchingSkills ? ',' + arrayMatchingSkillsCaseConditionQuery(subskills, devSkills, 'bs') : ''}
        FROM
          User u
          LEFT JOIN Submission s ON s.userId = u.id
          LEFT JOIN Bounties bs ON s.listingId = bs.id
          LEFT JOIN EmailSettings es on es.userId = u.id
        WHERE
          s.isWinner = 1 AND s.rewardInUSD > 0
          AND es.category = 'scoutInvite'
          AND (
            ${matchingWhereClause(subskills, devSkills, 'bs').join('\n  OR  ')}
	        )
          ${region !== 'GLOBAL' ? `AND u.location LIKE '%${region}%'` : ''}
        GROUP BY
          u.id
    `;

    const subskillPoWLikeQuery = (subskills: string[], alias: string) =>
      subskills.map((s) => `${alias}.subSkills LIKE CONCAT('%','${s}','%')`);

    const skillPoWLikeQuery = (skills: string[], alias: string) =>
      skills.map((s) => `${alias}.skills LIKE CONCAT('%','${s}','%')`);

    const sumSubSkillsContainProjectQuery = (subskillWhere: string[]) =>
      ` 
      SUM  (
        ${
          subskills.length > 0
            ? `
          ${subskillWhere.map((w) => `CASE WHEN ${w} THEN 1 ELSE 0 END`).join('\n + \n')}
        `
            : `0+0`
        }
      ) as matchedProjectSubSkills
    `;

    const sumSkillsContainProjectQuery = (skillWhere: string[]) =>
      ` 
      SUM  (
        ${
          devSkills.length > 0
            ? `
          ${skillWhere.map((w) => `CASE WHEN ${w} THEN 1 ELSE 0 END`).join('\n + \n')}
        `
            : `0+0`
        }
      ) as matchedProjectSkills
    `;

    const matchingSkillsPoWQuery = `
		    SELECT
		      u.id as userId,
          ${sumSubSkillsContainProjectQuery(subskillPoWLikeQuery(subskills, 'p'))},
          ${sumSkillsContainProjectQuery(skillPoWLikeQuery(devSkills, 'p'))},
		      t1.dollarsEarned
		    FROM
		      User u
		    LEFT JOIN PoW p on p.userId = u.id
        LEFT JOIN EmailSettings es on es.userId = u.id
		    LEFT JOIN (
          ${userWithMatchingSubmissionsQuery()}
		    ) as t1 ON u.id = t1.userId
		    WHERE
		      (
            ${[...subskillPoWLikeQuery(subskills, 'p'), ...skillPoWLikeQuery(devSkills, 'p')].join('\n OR \n')}
          )
		      AND t1.dollarsEarned > 0
          AND es.category = 'scoutInvite'
		    GROUP BY
		      u.id, t1.dollarsEarned
    `;

    const minMaxSubmissionsQuery = `
      SELECT 
			  COALESCE(MAX(t.dollarsEarned),0) as maxDollarsEarned,
			  COALESCE(MIN(t.dollarsEarned),0) as minDollarsEarned,
			  COALESCE(MAX(t.matchingSubSkills),0) as maxMatchingSubSkills,
			  COALESCE(MIN(t.matchingSubSkills),0) as minMatchingSubSkills,
			  COALESCE(MAX(t.matchingSkills),0) as maxMatchingSkills,
			  COALESCE(MIN(t.matchingSkills),0) as minMatchingSkills
		  FROM (
        ${userWithMatchingSubmissionsQuery(true)}
		  ) as t
    `;

    const minMaxPowQuery = `
      SELECT
		    MAX(t.matchedProjectSubSkills) as maxMatchedProjectSubSkills,
		    MIN(t.matchedProjectSubSkills) as minMatchedProjectSubSkills,
		    MAX(t.matchedProjectSkills) as maxMatchedProjectSkills,
		    MIN(t.matchedProjectSkills) as minMatchedProjectSkills
		  FROM (
        ${matchingSkillsPoWQuery}
		  ) as t
    `;

    const normalizeQuery = `
      SELECT
        u.id as userId,
        t1.dollarsEarned as dollarsEarned,
        t3.maxDollarsEarned,
        t3.minDollarsEarned,
        (CASE 
          WHEN (t3.maxDollarsEarned - t3.minDollarsEarned) = 0 THEN 0
          ELSE (0.9 * (t1.dollarsEarned - t3.minDollarsEarned) / (t3.maxDollarsEarned - t3.minDollarsEarned)) + 0.1
        END) AS normalizedDollarsEarned,
        t1.matchingSubSkills,
        t3.maxMatchingSubSkills,
        t3.minMatchingSubSkills,
        (CASE
          WHEN (t3.maxMatchingSubSkills - t3.minMatchingSubSkills) = 0 THEN 0
          ELSE (0.9 * (t1.matchingSubSkills - t3.minMatchingSubSkills) / (t3.maxMatchingSubSkills - t3.minMatchingSubSkills)) + 0.1 
        END) AS normalizedMatchingSubSkills,
        t1.matchingSkills,
        t3.maxMatchingSkills,
        t3.minMatchingSkills,
        (CASE
          WHEN (t3.maxMatchingSkills - t3.minMatchingSkills) = 0 THEN 0
          ELSE (0.9 * (t1.matchingSkills - t3.minMatchingSkills) / (t3.maxMatchingSkills - t3.minMatchingSkills)) + 0.1 
        END) AS normalizedMatchingSkills,
        COALESCE(t2.matchedProjectSubSkills, 0) as matchedProjectSubSkills,
        t4.maxMatchedProjectSubSkills,
        t4.minMatchedProjectSubSkills,
        (CASE
          WHEN (t4.maxMatchedProjectSubSkills - t4.minMatchedProjectSubSkills) = 0 THEN 0
          ELSE COALESCE((0.9 * (t2.matchedProjectSubSkills - t4.minMatchedProjectSubSkills) / (t4.maxMatchedProjectSubSkills - t4.minMatchedProjectSubSkills)) + 0.1, 0) 
        END) AS normalizedMatchedProjectSubSkills,
        COALESCE(t2.matchedProjectSkills, 0) as matchedProjectSkills,
        t4.maxMatchedProjectSkills,
        t4.minMatchedProjectSkills,
        (CASE
          WHEN (t4.maxMatchedProjectSkills - t4.minMatchedProjectSkills) = 0 THEN 0
          ELSE COALESCE((0.9 * (t2.matchedProjectSkills - t4.minMatchedProjectSkills) / (t4.maxMatchedProjectSkills - t4.minMatchedProjectSkills)) + 0.1, 0) 
        END) AS normalizedMatchedProjectSkills,
        t1.matchedSkillsArray,
        u.stRecommended
      FROM
      User u
      LEFT JOIN (
        ${userWithMatchingSubmissionsQuery(true, true)}
      ) t1 ON u.id = t1.userId
      LEFT JOIN (
        ${matchingSkillsPoWQuery}
      ) t2 ON u.id = t2.userId
      CROSS JOIN (
        ${minMaxSubmissionsQuery}
      ) t3
      CROSS JOIN (
        ${minMaxPowQuery}
      ) t4
    `;

    // COMBINATION OF NON DEV AND DEV LISTINGS (ALSO PURELY DEV LISTING)
    let weights: {
      isSql: boolean;
      name: string;
      weight: number;
      diffAccessor?: string;
    }[] = [
      {
        isSql: true,
        name: 'normalizedDollarsEarned',
        weight: 0.25,
      },
      {
        isSql: false,
        name: 'normalizedMatchingSubSkills',
        weight: 0.2,
      },
      {
        isSql: false,
        name: 'normalizedMatchingSkills',
        weight: 0.2,
      },
      {
        isSql: true,
        name: 'normalizedMatchedProjectSubSkills',
        weight: 0.05,
      },
      {
        isSql: true,
        name: 'stRecommended',
        diffAccessor: 'normalizedDollarsEarned',
        weight: 0.3,
      },
    ];

    // PURELY NON DEV LISTINGS
    if (devSkills.length === 0 && subskills.length > 0) {
      weights = [
        {
          isSql: true,
          name: 'normalizedDollarsEarned',
          weight: 0.25,
        },
        {
          isSql: false,
          name: 'normalizedMatchingSubSkills',
          weight: 0.4,
        },
        {
          isSql: true,
          name: 'normalizedMatchedProjectSubSkills',
          weight: 0.05,
        },
        {
          isSql: true,
          name: 'stRecommended',
          diffAccessor: 'normalizedDollarsEarned',
          weight: 0.3,
        },
      ];
    }

    const selectScouts = `
      SELECT
      	UUID() AS id,
	      t.userId as userId,
	      '${scoutBounty.id}' as listingId,
	      t.dollarsEarned as dollarsEarned,
	      ((
          ${weights
            .filter((w) => w.isSql)
            .map((w) => {
              if (w.name === 'stRecommended') {
                return `
(CASE WHEN t.${w.name} = 1 THEN
(t.${w.diffAccessor ? w.diffAccessor : w.name} * ${w.weight})
ELSE 0
END)
`;
              } else {
                return ` (t.${w.name} * ${w.weight}) `;
              }
            })
            .join(' \n +  ')}
	      ) * 5 ) + 5 AS score,
	      t.matchedSkillsArray as skills,
	      false as invited,
	      CURRENT_TIMESTAMP AS createdAt
      FROM (
        ${normalizeQuery}
      ) as t
      WHERE matchedSkillsArray IS NOT NULL
      ORDER BY score desc
      LIMIT ${LIMIT};
    `;

    const insertQuery = `
      INSERT INTO Scouts (id, userId, listingId, dollarsEarned, 
        score, skills, invited, createdAt)
      ${selectScouts}
    `;

    logger.debug('Executing insert query for new scouts');
    await prisma.$executeRawUnsafe(insertQuery);

    if (prevScouts.length > 0) {
      const invitedScouts = prevScouts
        .filter((s) => s.invited)
        .map((s) => s.userId);

      if (invitedScouts.length > 0) {
        logger.debug('Updating invited status for previous scouts');
        await prisma.scouts.updateMany({
          where: {
            userId: {
              in: invitedScouts,
            },
            listingId: id,
          },
          data: {
            invited: true,
          },
        });
      }
    }

    logger.debug('Fetching new scouts after insert');
    const scouts = await prisma.scouts.findMany({
      where: {
        listingId: id,
      },
      orderBy: {
        score: 'desc',
      },
      include: {
        user: {
          select: {
            stRecommended: true,
            firstName: true,
            lastName: true,
            username: true,
            photo: true,
          },
        },
      },
    });

    scouts.forEach((scout) => {
      if (Array.isArray(scout.skills)) {
        const devSkills = filterInDevSkills(scout.skills as string[]);
        const subskills = (scout.skills as string[]).filter(
          (s) => !devSkills.includes(s),
        );
        scout.skills = [...new Set(devSkills.concat(subskills))];
      }
    });

    let maxSubskill = 0,
      minSubskill = 0,
      maxSkill = 0,
      minSkill = 0;
    scouts.forEach((scout) => {
      let totalSubskill = 0,
        totalSkill = 0;
      if (Array.isArray(scout.skills)) {
        totalSkill = filterInDevSkills(scout.skills as string[]).length;
        totalSubskill = scout.skills.length - totalSkill;
      }
      if (maxSubskill < totalSubskill) maxSubskill = totalSubskill;
      if (minSubskill > totalSubskill) minSubskill = totalSubskill;
      if (maxSkill < totalSkill) maxSkill = totalSkill;
      if (minSkill > totalSkill) minSkill = totalSkill;
    });

    scouts.forEach((scout) => {
      let totalSubskill = 0,
        totalSkill = 0;
      if (Array.isArray(scout.skills)) {
        totalSkill = filterInDevSkills(scout.skills as string[]).length;
        totalSubskill = scout.skills.length - totalSkill;
      }
      const normalizedSubskill =
        maxSubskill > 0
          ? ((0.9 * (totalSubskill - minSubskill)) /
              (maxSubskill - minSubskill) +
              0.1) *
            (weights.find((s) => s.name === 'normalizedMatchingSubSkills')
              ?.weight ?? 0)
          : 0;
      const normalizedSkill =
        maxSkill > 0
          ? ((0.9 * (totalSkill - minSkill)) / (maxSkill - minSkill) + 0.1) *
            (weights.find((s) => s.name === 'normalizedMatchingSkills')
              ?.weight ?? 0)
          : 0;
      const adjustmentScore = (normalizedSkill + normalizedSubskill) * 5;

      scout.score = Prisma.Decimal.add(
        scout.score,
        new Prisma.Decimal(adjustmentScore.toFixed(2)),
      );
    });

    scouts.sort((a, b) => b.score.toNumber() - a.score.toNumber());

    await prisma.$transaction(
      async (tsx) => {
        return await Promise.all(
          scouts.map(async (s) => {
            return await tsx.scouts.updateMany({
              where: {
                id: s.id,
              },
              data: {
                score: s.score,
                skills: s.skills ?? undefined,
              },
            });
          }),
        );
      },
      {
        timeout: 1000000,
        maxWait: 1000000,
      },
    );

    logger.info(`Successfully generated scouts for bounty ID: ${id}`);
    res.send(scouts);
  } catch (error: any) {
    logger.error(
      `Error occurred while generating scouts for bounty with id=${id}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while generating scouts for bounty with id=${id}.`,
    });
  }
}

export default withAuth(scoutTalent);
