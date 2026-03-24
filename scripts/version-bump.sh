#!/usr/bin/env bash
# version-bump.sh — SemVer helper
# Usage: ./scripts/version-bump.sh [patch|minor|major]
# Default: patch

set -e

TYPE=${1:-patch}

if [[ "$TYPE" != "patch" && "$TYPE" != "minor" && "$TYPE" != "major" ]]; then
  echo "Usage: $0 [patch|minor|major]"
  exit 1
fi

# Bump version in package.json and create a git tag
npm version "$TYPE" --no-git-tag-version

NEW_VERSION=$(node -p "require('./package.json').version")

echo "Bumped to v$NEW_VERSION"
echo ""
echo "Next steps:"
echo "  git add package.json"
echo "  git commit -m \"chore: bump version to v$NEW_VERSION\""
echo "  git tag v$NEW_VERSION"
echo "  git push && git push --tags"
