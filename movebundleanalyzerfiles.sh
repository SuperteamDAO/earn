#!/bin/bash

# Move the bundle analysis files to the public directory
mkdir -p ./public/bundleanalyze
mv ./.next/analyze/* ./public/bundleanalyze/
