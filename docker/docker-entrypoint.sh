#!/bin/bash
service mysql start
export DATABASE_URL=mysql://earn:earn@127.0.0.1:3306/earn

# Check if the database exists, and if not, create it
if ! mysql -e 'USE earn'; then
  mysql -e "CREATE DATABASE earn"
  mysql -e "CREATE USER 'earn'@'localhost' IDENTIFIED BY 'earn'"
  mysql -e "GRANT ALL PRIVILEGES ON *.* TO 'earn'@'localhost'"
  npx prisma migrate dev --name init
  npx prisma generate
fi

# Start the application
exec "$@"
