# Agent Instructions

## Release And Publish

Use the GitHub Actions npm publish workflow. Do not run `npm publish` locally;
local publishing asks for npm 2FA and is not the configured release path.

The repository publishes with npm Trusted Publishing through
`.github/workflows/publish.yml`. The workflow is triggered by version tags that
match `v*`, runs tests and typecheck, verifies that the tag matches the package
version, and then publishes to npm via GitHub's OIDC token.

Release checklist:

1. Review the diff and confirm the intended release scope.
2. Update `package.json` and `package-lock.json` to the new version.
3. Run:

   ```bash
   npm test
   npm run build
   npx tsc --noEmit
   npm pack --dry-run
   ```

4. Commit the release changes, usually with `Release X.Y.Z`.
5. Create a matching tag, for example `v2.0.6` for package version `2.0.6`.
6. Push `main` and the tag together:

   ```bash
   git push origin main vX.Y.Z
   ```

7. Watch the workflow and verify the npm registry:

   ```bash
   gh run list --workflow publish.yml --limit 5
   gh run watch <run-id> --exit-status
   npm view astro-inspect-clip version dist-tags --json
   ```
