#!/bin/sh

# See the following for detail on writing Bourne Shell Scripts like this one
#   https://developer.apple.com/library/content/documentation/OpenSource/Conceptual/ShellScripting/Introduction/Introduction.html
#
# To make executable:
#
#   chmod u+x copy-files.sh
#
# To run
#
# . copy-files.sh

echo ""
echo "Copy css files"
cp src/css/* public/css

echo ""
echo "Copy img files"
cp src/img/* public/img

echo ""
echo "Copy favicons files"
cp favicon-16x16.png public
cp favicon-32x32.png public
cp favicon-96x96.png public
cp favicon.ico public
