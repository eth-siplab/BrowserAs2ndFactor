# More convenient 2FA for ETH Zurich

## Approaches

1. Seeded TOTP directly run in extension detecting ETHZ 2FA, then automatically generate short code and submit.
2. Use Notebooks camera to detect smartphone with opened 2FA App (Google or Microsoft) then extract correct 2FA Code, fill in and submit.

### Seeded TOTP Extension

To generate the Chrome extension run `npm run build` in the folder `TOTP_extension`. Then upload the generated `dist` Folder to Chrome in the extension window with activated Developer Mode.
