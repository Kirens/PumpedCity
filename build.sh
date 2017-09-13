#!/bin/bash

# Short reminder 
echo "WARNING: this is an extremely simple build script and mght not produce the result you expect"
echo "Make sure this is called in the project root"

# Create output directory
mkdir install

# Get the credentials
value=`cat backend/credentials`

# Find where the www folder is
www="\/www"
wd=$(pwd | sed 's/\//\\\//g')$www

# Substitute in nginx conf and export
sed -e "s/{{WWW FOLDER}}/$wd/g" backend/nginx_conf | sed -e "s/{{ACCESS TOKEN}}/$value/g" > install/nginx

# Try to reload nginx if config is fine
sudo nginx -t && sudo service nginx reload


echo "Config assembled and server reloaded!"
