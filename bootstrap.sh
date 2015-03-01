#!/bin/sh

echo "Installing dependencies... (assuming XCode is installed)"

echo "Installing awscli via Brew"
brew install awscli

echo "Installing Wine via Brew"
brew install wine

echo "Installing Gnu-tar via Brew"
brew install gnu-tar

echo "Installing npm deps for the app"
(cd nwapp && npm install)

echo "Installing packaging deps"
npm install

echo "Installing fpm Ruby gem"
sudo gem install fpm

echo "Cloning DMG tools"
git remote add create-dmg git@github.com:andreyvit/create-dmg.git
git subtree add --prefix=osx/create-dmg --squash create-dmg master

echo "Done. If you need to configure AWS CLI tools, run: aws configure"
