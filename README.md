# Browser as a second factor for ETH authentication

Use PCs or laptops as the second factor for ETH authentication.

## Download

You can download a pre-compiled and packaged release here: [ETH2ndFactor.zip](https://drive.google.com/uc?export=download&id=1Y5u7pQ3sAzQzyUa-0mign86mWGkWRFAt).

To install, simply drag the file into the [Chrome Extensions](chrome://extensions) or [Edge Extensions](edge://extensions) page.


## Manually building the extension

To generate the Chrome or Edge extension, run `npm run build` in the folder `TOTP_extension`.

Then upload the generated `dist` Folder to Chrome/Edge in the extension window with activated Developer Mode.
