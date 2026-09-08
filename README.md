# ETH Browser as Second Factor

Browser extensions that generate and automatically submit an ETH Zurich TOTP
code on supported authentication pages.

## Repository layout

```text
chrome/            Chrome and Edge extension source, build, and release ZIP
firefox/           Firefox WebExtension
safari/            Safari Web Extension and its required Apple containers
assets/            Project-level design assets
```

Generated folders such as `node_modules/` and `dist/` remain ignored by Git.

## Automated releases

Push a version tag on a commit containing `.github/workflows/release.yml`:

```sh
git tag v0.3.0
git push origin v0.3.0
```

The workflow builds Chrome and packages Firefox on GitHub's Linux runner, then
creates a GitHub release with two ZIP assets: Chrome and Firefox.
Re-running a workflow replaces assets on the existing release.
Use numeric `vMAJOR.MINOR.PATCH` tags; package versions come from the tag.

Chrome ZIPs can be extracted and loaded unpacked. Firefox ZIPs are unsigned:
use temporary loading during development or submit to Mozilla for signing before
normal installation. Safari is not built or published by this workflow.
No extra secrets are needed for these builds
or GitHub releases; publishing uses the workflow's built-in GitHub token.

## Chrome and Edge

The maintained TypeScript implementation is in `chrome/`. The old
`Chrome_ts` name only described an implementation detail, so it has been removed.

```sh
cd chrome
npm install
npm run build
```

Load `chrome/dist/` as an unpacked extension. A packaged build is available at
`chrome/releases/eth-browser-as-2nd-factor.zip`.

## Firefox

See `firefox/README.md` for temporary installation and testing.

## Safari on iPhone, iPad, and Mac

Open `safari/Sa2FETH.xcodeproj` in Xcode. Use the `Sa2FETH (iOS)`
scheme for iPhone or iPad and the `Sa2FETH (macOS)` scheme for Mac.

Safari extensions cannot be shipped as loose folders on Apple platforms. Apple
requires a Safari Web Extension to be embedded in a containing app, which is why
`safari/` contains both directories:

- `extension/` contains the actual WebExtension and platform extension targets.
- `app/` contains the minimal required iOS and macOS container apps.

Within each directory, `shared/` holds cross-platform code while `ios/` and
`macos/` hold platform-specific files.

After installing the iOS app, enable Sa2FETH in **Settings → Apps → Safari →
Extensions**, allow access to `access.ethz.ch` and `idbdfedin16.ethz.ch`, and use
the extension button in Safari once to save the TOTP secret.
