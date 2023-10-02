SELECT
  uuid() AS `id`,
  `superteam-earn-v2`.`Grants`.`token` AS `token`,
  count(0) AS `count`,
  sum(`superteam-earn-v2`.`Grants`.`rewardAmount`) AS `total`
FROM
  `superteam-earn-v2`.`Grants`
GROUP BY
  `superteam-earn-v2`.`Grants`.`token`