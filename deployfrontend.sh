rsync -r src/ docs/
rsync build/contracts/*.* docs/
git add .
git commit -m "Adding frontend files to Github Pages"
git push
