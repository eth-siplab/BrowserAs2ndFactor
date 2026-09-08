const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32ToBytes(seed) {
    const normalized = seed.toUpperCase().replace(/[\s=]/g, "");
    if (!normalized || !/^[A-Z2-7]+$/.test(normalized)) return null;

    let bits = "";
    for (const character of normalized) {
        bits += BASE32_ALPHABET.indexOf(character).toString(2).padStart(5, "0");
    }

    const bytes = [];
    for (let index = 0; index + 8 <= bits.length; index += 8) {
        bytes.push(parseInt(bits.slice(index, index + 8), 2));
    }
    return bytes.length ? new Uint8Array(bytes) : null;
}

async function generateTOTP(seed, period = 30, digits = 6) {
    const keyData = base32ToBytes(seed);
    if (!keyData) throw new Error("Invalid TOTP secret");

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-1" },
        false,
        ["sign"]
    );

    const counter = Math.floor(Date.now() / 1000 / period);
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(0, Math.floor(counter / 0x100000000), false);
    view.setUint32(4, counter >>> 0, false);

    const signature = new DataView(await crypto.subtle.sign("HMAC", cryptoKey, buffer));
    const offset = signature.getUint8(signature.byteLength - 1) & 0x0f;
    const value = (signature.getUint32(offset, false) & 0x7fffffff) % (10 ** digits);
    return value.toString().padStart(digits, "0");
}

async function getStoredSeed() {
    const stored = await browser.storage.local.get("totpSeed");
    if (stored.totpSeed) return stored.totpSeed;

    // Migrate builds that stored the value in an extension page's localStorage.
    const legacySeed = typeof localStorage !== "undefined"
        ? localStorage.getItem("totpSeed")
        : null;
    if (legacySeed) {
        await browser.storage.local.set({ totpSeed: legacySeed });
        return legacySeed;
    }
    return null;
}

browser.runtime.onMessage.addListener((message) => {
    if (message?.action !== "generateTOTP") return undefined;

    return getStoredSeed()
        .then((seed) => seed ? generateTOTP(seed) : null)
        .then((code) => code ? { code } : { code: "no_seed" })
        .catch((error) => {
            console.error("Unable to generate TOTP code:", error);
            return { code: "error" };
        });
});
