#!/bin/bash

sudo apt update
sudo apt install mysql-server -y
sudo service mysql start

sudo mysql -e "create database earn";
sudo mysql -e "create user earn@localhost identified by 'earn'";
sudo mysql -e "grant all privileges on *.* to earn@localhost";