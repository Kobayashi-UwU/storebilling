#!/bin/sh
set -e
node scripts/waitForDb.js
npm run migrate
npm start
