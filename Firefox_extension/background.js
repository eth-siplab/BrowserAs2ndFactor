async function generateTOTP(
  seed,
  window = 30,
  digits = 6
) {
  console.log("ETH Extension: generateTOTP called with:", {
    seedProvided: !!seed,
    seedLength: seed ? seed.length : 0,
    window,
    digits
  });
  
  const key = base32tohex(seed);
  console.log("ETH Extension: base32tohex result:", {
    keyGenerated: !!key,
    keyLength: key ? key.length : 0
  });

  if (!key) {
    console.error("ETH Extension: Invalid Seed");
    return "error";
  }

  const matcher = key.match(/.{1,2}/g);
  console.log("ETH Extension: Key matcher result:", {
    matcherGenerated: !!matcher,
    matcherLength: matcher ? matcher.length : 0
  });

  if (!matcher) {
    console.error("ETH Extension: Invalid crypto material");
    return "Crypto Error";
  }

  console.log("ETH Extension: Converting key to Uint8Array");
  const keyData = new Uint8Array(matcher.map((byte) => parseInt(byte, 16)));
  console.log("ETH Extension: Key data length:", keyData.length);
  
  console.log("ETH Extension: Importing crypto key");
  const cryptoMaterial = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  console.log("ETH Extension: Crypto material imported successfully");

  const epoch = Math.floor(Date.now() / 1000.0);
  const time = Math.floor(epoch / window);
  console.log("ETH Extension: Time calculation:", { epoch, time });
  
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);

  timeView.setUint32(4, time, false);
  timeView.setUint32(0, 0, false); // high order 32 bits 0

  console.log("ETH Extension: Generating HMAC");
  const hmac = await crypto.subtle.sign("HMAC", cryptoMaterial, timeBuffer);
  const hmacView = new DataView(hmac);
  console.log("ETH Extension: HMAC generated, length:", hmacView.byteLength);

  const offset = hmacView.getUint8(hmacView.byteLength - 1) & 0xf;
  const binary = (
    (hmacView.getUint32(offset) & 0x7fffffff) %
    10 ** digits
  ).toString();

  const result = binary.padStart(digits, "0");
  console.log("ETH Extension: Final TOTP code generated:", {
    resultLength: result.length,
    result: result
  });
  
  return result;
}

function base32tohex(base32) {
  var base32chars, bits, chunk, hex, i, val;
  base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  bits = "";
  hex = "";
  i = 0;
  while (i < base32.length) {
    val = base32chars.indexOf(base32.charAt(i).toUpperCase());
    bits += val.toString(2).padStart(5, "0");
    i++;
  }
  for (let i = 0; i + 4 <= bits.length; i += 4) {
    const chunk = bits.substr(i, 4);
    hex += parseInt(chunk, 2).toString(16);
  }

  return hex;
}

console.log("ETH Extension: Background script loaded");
console.log("ETH Extension: Background script timestamp:", new Date().toISOString());

browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log("ETH Extension: Received message in background script:", request);
  console.log("ETH Extension: Message sender:", sender);
  console.log("ETH Extension: Message timestamp:", new Date().toISOString());
  
  if (request.action === "generateTOTP") {
    try {
      console.log("ETH Extension: Processing generateTOTP request");
      console.log("ETH Extension: Getting stored seed from browser.storage.sync");
      
      const data = await browser.storage.sync.get("totpSeed");
      console.log("ETH Extension: Storage retrieval result:", { 
        hasSeed: !!data.totpSeed,
        seedLength: data.totpSeed ? data.totpSeed.length : 0,
        storageKeys: Object.keys(data)
      });
      
      if (!data.totpSeed) {
        console.log("ETH Extension: No seed found in storage");
        const result = { code: "no_seed" };
        console.log("ETH Extension: Returning:", result);
        return result;
      }
      
      console.log("ETH Extension: Seed found, generating TOTP code");
      const totpCode = await generateTOTP(data.totpSeed);
      console.log("ETH Extension: TOTP generation completed:", {
        codeGenerated: !!totpCode,
        codeLength: totpCode ? totpCode.length : 0,
        codeType: typeof totpCode
      });
      
      const result = { code: totpCode };
      console.log("ETH Extension: Returning TOTP result:", result);
      return result;
      
    } catch (error) {
      console.error("ETH Extension: Error in background script:", error);
      console.error("ETH Extension: Error stack:", error.stack);
      const errorResult = { code: "error", error: error.message };
      console.log("ETH Extension: Returning error result:", errorResult);
      return errorResult;
    }
  } else {
    console.log("ETH Extension: Unknown action in message:", request.action);
    return { code: "unknown_action" };
  }
});

browser.runtime.onInstalled.addListener(() => {
  browser.browserAction.openPopup();
});