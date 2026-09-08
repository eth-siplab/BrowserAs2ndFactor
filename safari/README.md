# Safari extension

This Xcode project builds the Safari Web Extension for iOS and macOS.

```text
app/
  shared/    Shared container-app UI
  ios/       iOS container target files
  macos/     macOS container target files
extension/
  shared/    WebExtension resources and native message handler
  ios/       iOS extension target configuration
  macos/     macOS extension target configuration
```

The container apps are required by Apple's Safari extension packaging model.
They provide installation and enablement instructions; authentication behavior
lives in `extension/shared/Resources/`.
