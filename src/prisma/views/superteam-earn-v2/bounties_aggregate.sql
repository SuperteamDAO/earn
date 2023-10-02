SELECT
  uuid() AS `id`,
  `superteam-earn-v2`.`Bounties`.`token` AS `token`,
  count(0) AS `count`,
  sum(`superteam-earn-v2`.`Bounties`.`rewardAmount`) AS `total`
FROM
  `superteam-earn-v2`.`Bounties`
GROUP BY
  `superteam-earn-v2`.`Bounties`.`token`