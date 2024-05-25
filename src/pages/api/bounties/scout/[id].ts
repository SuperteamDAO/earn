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

    console.log('skills', scoutBounty.skills);
    const subskills = flattenSubSkills(scoutBounty.skills as any);
    const devSkills = filterInDevSkills(
      flattenSkills(scoutBounty.skills as any),
    );
    console.log('skills extract', flattenSkills(scoutBounty.skills as any));
    console.log('devSkills', devSkills);

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
          CASE
            ${subskills
              .map(
                (s) => `
              WHEN JSON_CONTAINS(JSON_EXTRACT(${alias}.skills, '$[*].subskills'), JSON_QUOTE('${s}')) THEN JSON_QUOTE('${s}')
            `,
              )
              .join(' \n ')} \n
            ${skills
              .map(
                (s) => `
              WHEN JSON_CONTAINS(JSON_EXTRACT(${alias}.skills, '$[*].skills'), JSON_QUOTE('${s}')) THEN JSON_QUOTE('${s}')
            `,
              )
              .join(' \n ')}
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
      if (subskills.length > 0)
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
        GROUP BY
          u.id
`;

    const subskillPoWLikeQuery = (subskills: string[], alias: string) =>
      subskills
        .map((s) => `${alias}.subSkills LIKE CONCAT('%','${s}','%')`)
        .join('  OR  ');

    const matchingSkillsPoWQuery = `
      SELECT
        u.id as userId,
        COUNT(p.id) as matchedProjects
      FROM
        User u
        LEFT JOIN PoW p on p.userId = u.id
      WHERE
        ${subskillPoWLikeQuery(subskills, 'p')}
      GROUP BY
            u.id
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
		    MAX(t.matchedProjects) as maxMatchedProjects,
		    MIN(t.matchedProjects) as minMatchedProjects
		  FROM (
		    SELECT
		      u.id as userId,
		      COUNT(p.id) as matchedProjects,
		      t1.dollarsEarned
		    FROM
		      User u
		    LEFT JOIN PoW p on p.userId = u.id
		    LEFT JOIN (
          ${userWithMatchingSubmissionsQuery()}
		    ) as t1 ON u.id = t1.userId
		    WHERE
		      (
            ${subskillPoWLikeQuery(subskills, 'p')}
          )
		      AND t1.dollarsEarned > 0
		    GROUP BY
		      u.id, t1.dollarsEarned
		  ) as t
`;

    const normalizeQuery = `
      SELECT
        u.id as userId,
        t1.dollarsEarned as dollarsEarned,
        t3.maxDollarsEarned,
        t3.minDollarsEarned,
        (0.9 * (t1.dollarsEarned - t3.minDollarsEarned) / (t3.maxDollarsEarned - t3.minDollarsEarned)) + 0.1 AS normalizedDollarsEarned,
        t1.matchingSubSkills,
        t3.maxMatchingSubSkills,
        t3.minMatchingSubSkills,
        (0.9 * (t1.matchingSubSkills - t3.minMatchingSubSkills) / (t3.maxMatchingSubSkills - t3.minMatchingSubSkills)) + 0.1 AS normalizedMatchingSubSkills,
        t1.matchingSkills,
        t3.maxMatchingSkills,
        t3.minMatchingSkills,
        (0.9 * (t1.matchingSkills - t3.minMatchingSkills) / (t3.maxMatchingSkills - t3.minMatchingSkills)) + 0.1 AS normalizedMatchingSkills,
        COALESCE(t2.matchedProjects, 0) as matchedProjects,
        t4.maxMatchedProjects,
        t4.minMatchedProjects,
        COALESCE((0.9 * (t2.matchedProjects - t4.minMatchedProjects) / (t4.maxMatchedProjects - t4.minMatchedProjects)) + 0.1, 0) AS normalizedMatchedProjects,
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

    let weights: { name: string; weight: number }[] = [
      {
        name: 'normalizedDollarsEarned',
        weight: 0.2,
      },
      {
        name: 'normalizedMatchingSubSkills',
        weight: 0.4,
      },
      {
        name: 'normalizedMatchedProjects',
        weight: 0.1,
      },
      {
        name: 'stRecommended',
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
          name: 'normalizedMatchingSubSkills',
          weight: 0.1,
        },
        {
          name: 'normalizedMatchingSkills',
          weight: 0.3,
        },
        {
          name: 'normalizedMatchedProjects',
          weight: 0.1,
        },
        {
          name: 'stRecommended',
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
            .map(
              (w) => `
            (t.${w.name} * ${w.weight})
          `,
            )
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
