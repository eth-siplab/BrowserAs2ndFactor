async function generateTOTP(
  seed: string,
  window: number = 30,
  digits: number = 6
): Promise<string> {
  const key = base32tohex(seed);

  if (!key) {
    console.error("Invalid Seed");
    return "error";
  }

  const matcher = key.match(/.{1,2}/g);

  if (!matcher) {
    console.error("Invalid crypo material");
    return "Crypto Error";
  }

  const keyData = new Uint8Array(matcher.map((byte) => parseInt(byte, 16)));
  const cryptoMaterial = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const epoch = Math.floor(Date.now() / 1000.0);
  const time = Math.floor(epoch / window);
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);

  timeView.setUint32(4, time, false);
  timeView.setUint32(0, 0, false); // high order 32 bits 0

  const hmac = await crypto.subtle.sign("HMAC", cryptoMaterial, timeBuffer);
  const hmacView = new DataView(hmac);

  const offset = hmacView.getUint8(hmacView.byteLength - 1) & 0xf;
  const binary = (
    (hmacView.getUint32(offset) & 0x7fffffff) %
    10 ** digits
  ).toString();

  return binary.padStart(digits, "0");
}

function base32tohex(base32: string) {
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateTOTP") {
    chrome.storage.sync.get("totpSeed", async (data) => {
      console.log(data);
      const totpCode = await generateTOTP(data.totpSeed);
      sendResponse({ code: totpCode });
    });
    return true;
  }
});
