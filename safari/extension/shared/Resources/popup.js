let currentSeed = null;
let totpInterval = null;
let progressInterval = null;

const setupSection = document.getElementById("setup-section");
const seedInput = document.getElementById("totp-seed");
const saveSeedButton = document.getElementById("save-seed");
const totpSection = document.getElementById("totp-section");
const totpCode = document.getElementById("totp-code");
const copyButton = document.getElementById("copy-button");
const progressBar = document.getElementById("progress-bar");
const timeRemaining = document.getElementById("time-remaining");

function showConfiguredState() {
    seedInput.value = "";
    setupSection.style.display = "none";
    totpSection.style.display = "block";
}

function showSetupState() {
    seedInput.value = "";
    seedInput.placeholder = "Enter seed";
    setupSection.style.display = "block";
    totpSection.style.display = "none";
    seedInput.focus();
}

async function readStoredSeed() {
    const stored = await browser.storage.local.get("totpSeed");
    if (stored.totpSeed) return stored.totpSeed;

    const legacySeed = localStorage.getItem("totpSeed");
    if (legacySeed) {
        await browser.storage.local.set({ totpSeed: legacySeed });
        localStorage.removeItem("totpSeed");
        return legacySeed;
    }
    return null;
}

async function initialize() {
    try {
        currentSeed = await readStoredSeed();
        if (currentSeed) {
            showConfiguredState();
            startTOTPDisplay();
        } else {
            showSetupState();
        }
    } catch (error) {
        console.error("Unable to read extension storage:", error);
        showSetupState();
    } finally {
        document.body.classList.add("ready");
    }
}

saveSeedButton.addEventListener("click", async () => {
    const cleanSeed = seedInput.value.toUpperCase().replace(/[\s=]/g, "");
    if (!cleanSeed) {
        alert("Please enter a TOTP secret.");
        return;
    }
    if (!/^[A-Z2-7]+$/.test(cleanSeed)) {
        alert("Invalid secret. Please use Base32 characters A-Z and 2-7 only.");
        return;
    }

    try {
        await browser.storage.local.set({ totpSeed: cleanSeed });
        currentSeed = cleanSeed;
        showConfiguredState();
        startTOTPDisplay();
    } catch (error) {
        console.error("Unable to save TOTP secret:", error);
        alert("The secret could not be saved.");
    }
});

async function updateTOTPCode() {
    if (!currentSeed) return;
    try {
        const response = await browser.runtime.sendMessage({ action: "generateTOTP" });
        totpCode.textContent = /^\d{6}$/.test(response?.code) ? response.code : "ERROR";
    } catch (error) {
        console.error("Unable to request TOTP code:", error);
        totpCode.textContent = "ERROR";
    }
}

function updateProgressBar() {
    const seconds = Math.floor(Date.now() / 1000);
    const timeInCycle = seconds % 30;
    progressBar.style.width = `${(timeInCycle / 30) * 100}%`;
    timeRemaining.textContent = `${30 - timeInCycle}s remaining`;
    if (timeInCycle === 0) updateTOTPCode();
}

function startTOTPDisplay() {
    if (totpInterval) clearInterval(totpInterval);
    if (progressInterval) clearInterval(progressInterval);
    updateTOTPCode();
    updateProgressBar();
    totpInterval = setInterval(updateTOTPCode, 30000);
    progressInterval = setInterval(updateProgressBar, 250);
}

copyButton.addEventListener("click", async () => {
    const code = totpCode.textContent;
    if (!/^\d{6}$/.test(code)) return;

    try {
        await navigator.clipboard.writeText(code);
        copyButton.classList.add("success");
        totpCode.classList.add("copied");
        setTimeout(() => {
            copyButton.classList.remove("success");
            totpCode.classList.remove("copied");
        }, 1000);
    } catch (error) {
        console.error("Unable to copy TOTP code:", error);
    }
});

window.addEventListener("beforeunload", () => {
    if (totpInterval) clearInterval(totpInterval);
    if (progressInterval) clearInterval(progressInterval);
});

initialize();
