#!/bin/sh
# Re tests, it is best practice to add quotes around variables in case value contains spaces
# Also, the spaces after and before the [] are vital as are spaces around the equality tests

# Copy required source files
cp -R src/img docs
cp -R src/css docs
cp favicon*.* docs
cp sample.arte docs

# Set version for index.html
read -p "Enter version (number/[current datetime]):" version
if [ "$version" == "" ] 
then
    echo "setting version to date"
    version=`date +'%Y-%m-%d-%H-%M'`
fi
sed "s/_VERSION_/$version/" public-index.html > docs/index.html

# set the website url for the sharing buttons
read -p "Set website url as target for social media sharing [https://wolsten.github.io/ARTE]" url
if [ "$url" == "" ]
then
    url="https:\/\/wolsten.github.io\/ARTE"
fi
sed -i "" "s/_URL_/$url/" docs/index.html

# Use selected bundled version in index.html and geenrate required bundle
read -p "Transpile bundle to ES5 (Y/[N]): " transpile
if [ "$transpile" == '' ] || [ "$transpile" == 'N' ] || [ "$transpile" == 'n' ]
then
    sed -i "" "s/_JSV_/6/" docs/index.html
    webpack --env mode=production --env target=ES6 --config webpack.config.js
else 
    sed -i "" "s/_JSV_/5/" docs/index.html
    webpack --env mode=production --env target=ES5 --config webpack.config.js
fi