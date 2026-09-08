# ETH BrowserAs2ndFactor - Firefox Extension

This is the Firefox version of the ETH BrowserAs2ndFactor Chrome extension, converted to work with Firefox WebExtensions API.

## Installation

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on..."
4. Navigate to this folder and select the `manifest.json` file
5. The extension should now be loaded and visible in the toolbar

Temporary add-ons are removed when Firefox restarts. For a persistent installation
in standard Firefox, Mozilla must sign the extension, but it does not need a
public listing on the add-ons store: a signed, self-distributed XPI can be hosted
on GitHub Releases. See Mozilla's [signing and distribution overview](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/).

## Usage

1. Click the extension icon to open the popup
2. Enter your TOTP seed in the input field
3. Click "Save" to store the seed
4. Navigate to supported ETH authentication pages:
   - `https://access.ethz.ch/idpauthapp/*`
   - `https://access.ethz.ch/fidoapp/*`
   - `https://idbdfedin16.ethz.ch/*`
5. The extension will automatically generate and fill in the TOTP code

## Key Differences from Chrome Version

- Uses Firefox WebExtensions API (`browser.*` instead of `chrome.*`)
- Uses Manifest v2 for better Firefox compatibility
- Converted TypeScript to plain JavaScript
- Uses Promise-based API calls instead of callbacks where applicable

## File structure

- `manifest.json` - Extension manifest (v2 for Firefox)
- `background.js` - Background script for TOTP generation
- `content.js` - Content script for auto-filling forms
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `images/` - Extension icons and logos
