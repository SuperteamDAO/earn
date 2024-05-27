import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

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

async function scoutTalent(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;
  const id = params.id as string;

  const LIMIT = 10;

  console.log('called scout');
  if (req.method !== 'POST') res.status(405).send('Not Allowed');

  try {
    const scoutBounty = await prisma.bounties.findFirst({
      where: {
        id,
      },
    });
    if (
      scoutBounty === null ||
      (scoutBounty.skills as any)?.[0].subskills === null
    )
      return res.status(404).send('Bounty has No skills');

    // console.log('skills', scoutBounty.skills);
    const subskills = flattenSubSkills(scoutBounty.skills as any);
    const devSkills = filterInDevSkills(
      flattenSkills(scoutBounty.skills as any),
    );
    // console.log('skills extract', flattenSkills(scoutBounty.skills as any));
    // console.log('devSkills', devSkills);
    //
    const region = scoutBounty.region.toString();

    const prevScouts = await prisma.scouts.findMany({
      where: {
        listingId: id,
      },
    });
    // console.log('prevScouts', prevScouts);

    if (prevScouts.length > 0) {
      await prisma.scouts.deleteMany({
        where: {
          listingId: id,
        },
      });
      console.log('delete done');
    }

    const sumMatchingSubSkillsQuery = `
      SUM(
        ${
          devSkills.length === 0 && subskills.length > 0
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
          CASE
            ${
              devSkills.length === 0
                ? subskills
                    .map(
                      (s) => `
              WHEN JSON_CONTAINS(JSON_EXTRACT(${alias}.skills, '$[*].subskills'), JSON_QUOTE('${s}')) THEN JSON_QUOTE('${s}')
            `,
                    )
                    .join(' \n ')
                : ''
            } \n
            ${
              devSkills.length > 0
                ? skills
                    .map(
                      (s) => `
              WHEN JSON_CONTAINS(JSON_EXTRACT(${alias}.skills, '$[*].skills'), JSON_QUOTE('${s}')) THEN JSON_QUOTE('${s}')
            `,
                    )
                    .join(' \n ')
                : ''
            }
          END
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
        WHERE
          s.isWinner = 1 AND s.rewardInUSD > 0
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
          devSkills.length === 0 && subskills.length > 0
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
		    LEFT JOIN (
          ${userWithMatchingSubmissionsQuery()}
		    ) as t1 ON u.id = t1.userId
		    WHERE
		      (
            ${[...subskillPoWLikeQuery(subskills, 'p'), ...skillPoWLikeQuery(devSkills, 'p')].join('\n OR \n')}
          )
		      AND t1.dollarsEarned > 0
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

    let weights: { name: string; weight: number; diffAccessor?: string }[] = [
      {
        name: 'normalizedDollarsEarned',
        weight: 0.2,
      },
      {
        name: 'normalizedMatchingSubSkills',
        weight: 0.4,
      },
      {
        name: 'normalizedMatchedProjectSubSkills',
        weight: 0.1,
      },
      {
        name: 'stRecommended',
        diffAccessor: 'normalizedDollarsEarned',
        weight: 0.3,
      },
    ];

    if (devSkills.length > 0) {
      weights = [
        {
          name: 'normalizedDollarsEarned',
          weight: 0.2,
        },
        {
          name: 'normalizedMatchingSkills',
          weight: 0.4,
        },
        {
          name: 'normalizedMatchedProjectSkills',
          weight: 0.1,
        },
        {
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
      ORDER BY score desc
      LIMIT ${LIMIT};
    `;

    const insertQuery = `
      INSERT INTO Scouts (id, userId, listingId, dollarsEarned, 
        score, skills, invited, createdAt)
      ${selectScouts}
`;

    console.log('insertQuery', insertQuery);
    // console.log('selectScouts', selectScouts);
    // const resp = await prisma.$queryRawUnsafe(selectScouts);
    await prisma.$executeRawUnsafe(insertQuery);
    // console.log("resp aefe")

    if (prevScouts.length > 0) {
      const invitedScouts = prevScouts
        .filter((s) => s.invited)
        .map((s) => s.userId);

      // console.log('invitedScouts', invitedScouts);

      if (invitedScouts.length > 0) {
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

    const scouts = await prisma.scouts.findMany({
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

    res.send(scouts);
  } catch (error) {
    // console.log(error);
    // console.log('scout error - ', JSON.stringify(error, null, 2));
    return res.status(400).json({
      error,
      message: `Error occurred while generating scouts for bounty with id=${id}.`,
    });
  }
}

export default scoutTalent;
