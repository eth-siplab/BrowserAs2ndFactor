// Global variables
let currentSeed: string | null = null;
let totpInterval: number | null = null;
let progressInterval: number | null = null;

// UI Elements
const seedInput = document.getElementById("totp-seed") as HTMLInputElement;
const saveSeedBtn = document.getElementById("save-seed") as HTMLButtonElement;
const setupSection = document.getElementById("setup-section") as HTMLElement;
const totpSection = document.getElementById("totp-section") as HTMLElement;
const totpCodeDisplay = document.getElementById("totp-code") as HTMLElement;
const copyButton = document.getElementById("copy-button") as HTMLButtonElement;
const progressBar = document.getElementById("progress-bar") as HTMLElement;
const timeRemaining = document.getElementById("time-remaining") as HTMLElement;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadStoredSeed();
});

// Load stored seed on popup open
async function loadStoredSeed() {
  chrome.storage.local.get("totpSeed", (data) => {
    if (data.totpSeed) {
      currentSeed = data.totpSeed;
      showConfiguredState();
      startTOTPDisplay();
    } else {
      showSetupState();
    }

    document.body.classList.add("ready");
  });
}

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
  saveSeedBtn.classList.remove("disabled");
  saveSeedBtn.disabled = false;
  seedInput.focus();
}

// Save seed button handler
document.getElementById("save-seed")?.addEventListener("click", () => {
  const seed = seedInput.value;
  
  if (saveSeedBtn.disabled) {
    return;
  }
  
  if (!seed.trim()) {
    alert("Please enter a TOTP seed!");
    return;
  }
  
  // Validate seed format (basic check for base32)
  if (!/^[A-Z2-7\s]+$/i.test(seed)) {
    alert("Invalid seed format. Please use base32 characters only.");
    return;
  }
  
  const cleanSeed = seed.toUpperCase().replace(/\s/g, "");
  currentSeed = cleanSeed;
  
  chrome.storage.local.set({ totpSeed: cleanSeed }, () => {
    alert("TOTP seed saved!");
    showConfiguredState();
    startTOTPDisplay();
  });
});

// Start TOTP display and progress bar
async function startTOTPDisplay() {
  if (!currentSeed) return;
  
  // Clear any existing intervals
  if (totpInterval) clearInterval(totpInterval);
  if (progressInterval) clearInterval(progressInterval);
  
  // Generate initial code
  await updateTOTPCode();
  
  // Set up intervals
  totpInterval = window.setInterval(updateTOTPCode, 30000); // Update every 30 seconds
  progressInterval = window.setInterval(updateProgressBar, 100); // Update progress every 100ms
}

// Update TOTP code by asking background script
async function updateTOTPCode() {
  if (!currentSeed) return;
  
  try {
    chrome.runtime.sendMessage({ action: "generateTOTP" }, (response) => {
      if (response && response.code && response.code !== "error" && response.code !== "Crypto Error") {
        totpCodeDisplay.textContent = response.code;
      } else {
        totpCodeDisplay.textContent = "ERROR";
      }
    });
  } catch (error) {
    console.error("Error generating TOTP:", error);
    totpCodeDisplay.textContent = "ERROR";
  }
}

// Update progress bar
function updateProgressBar() {
  const now = Date.now();
  const currentTime = Math.floor(now / 1000);
  const timeInCycle = currentTime % 30;
  const progress = (timeInCycle / 30) * 100;
  const remaining = 30 - timeInCycle;
  
  progressBar.style.width = `${progress}%`;
  timeRemaining.textContent = `${remaining}s remaining`;
  
  // If we're at the start of a new cycle, update the code
  if (timeInCycle === 0) {
    updateTOTPCode();
  }
}

// Copy button handler
copyButton.addEventListener("click", async () => {
  const code = totpCodeDisplay.textContent;
  if (code && code !== "------" && code !== "ERROR") {
    try {
      await navigator.clipboard.writeText(code);
      
      // Visual feedback for both button and code field
      copyButton.classList.add("success");
      copyButton.style.backgroundColor = "#28a745";
      totpCodeDisplay.classList.add("copied");
      
      setTimeout(() => {
        copyButton.classList.remove("success");
        copyButton.style.backgroundColor = "";
        totpCodeDisplay.classList.remove("copied");
      }, 1000);
    } catch (error) {
      console.error("Failed to copy:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      copyButton.classList.add("success");
      copyButton.style.backgroundColor = "#28a745";
      totpCodeDisplay.classList.add("copied");
      setTimeout(() => {
        copyButton.classList.remove("success");
        copyButton.style.backgroundColor = "";
        totpCodeDisplay.classList.remove("copied");
      }, 1000);
    }
  }
});

// Cleanup on popup close
window.addEventListener('beforeunload', () => {
  if (totpInterval) clearInterval(totpInterval);
  if (progressInterval) clearInterval(progressInterval);
});
