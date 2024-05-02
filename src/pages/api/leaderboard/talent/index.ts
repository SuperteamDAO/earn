// import { NextApiRequest, NextApiResponse } from "next";
//
// export default async function user(req: NextApiRequest, res: NextApiResponse) {
//
//   let offset = parseInt((req.query.offset as string)) || null;
//   if (offset && isNaN(offset)) offset = 0;
//
//   const query = `
// SELECT
//     u.userID,
//     (SELECT MAX(dollarsEarned) FROM users) AS maxDollars,
//     (SELECT MIN(dollarsEarned) FROM usebrs) AS minDollars,
//     (SELECT MAX(winRate) FROM (SELECT COUNT(CASE WHEN isWinner THEN 1 END) / COUNT(*) AS winRate FROM submissions GROUP BY userID) AS winRates) AS maxWinRate,
//     (SELECT MIN(winRate) FROM (SELECT COUNT(CASE WHEN isWinner THEN 1 END) / COUNT(*) AS winRate FROM submissions GROUP BY userID) AS winRates) AS minWinRate,
//     u.dollarsEarned,
//     COUNT(CASE WHEN s.isWinner THEN 1 END) / COUNT(*) AS winRate
// FROM
//     users u
// JOIN
//     submissions s ON u.userID = s.userID
// WHERE
//   u.dollarsEarned > 0 AND s.createdAt >= '2024-01-01'
// GROUP BY
//     u.userID
// ORDER BY
//     (
//         (50 * ((u.dollarsEarned - minDollars) / (maxDollars - minDollars))) +
//         (50 * ((winRate - minWinRate) / (maxWinRate - minWinRate)))
//     ) DESC;
// `
// }
