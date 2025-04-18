-- This is an empty migration.

UPDATE `Submission` SET `paymentDetails` = JSON_SET(
  `paymentDetails`,
  '$.link',
  CONCAT('https://nearblocks.io/txns/', JSON_UNQUOTE(JSON_EXTRACT(`paymentDetails`, '$.txId')))
) WHERE JSON_EXTRACT(`paymentDetails`, '$.txId') IS NOT NULL;
