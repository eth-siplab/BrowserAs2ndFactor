// Global variables
let currentSeed = null;
let totpInterval = null;
let progressInterval = null;

// UI Elements
const seedInput = document.getElementById("totp-seed");
const saveSeedBtn = document.getElementById("save-seed");
const divider = document.getElementById("divider");
const totpSection = document.getElementById("totp-section");
const totpCodeDisplay = document.getElementById("totp-code");
const copyButton = document.getElementById("copy-button");
const progressBar = document.getElementById("progress-bar");
const timeRemaining = document.getElementById("time-remaining");

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadStoredSeed();
});

// Load stored seed on popup open
async function loadStoredSeed() {
  browser.storage.sync.get("totpSeed").then((data) => {
    if (data.totpSeed) {
      currentSeed = data.totpSeed;
      // Show masked seed in input
      seedInput.value = "*".repeat(Math.min(data.totpSeed.length, 20));
      seedInput.classList.add("masked");
      
      // Disable save button since seed is already saved
      saveSeedBtn.classList.add("disabled");
      saveSeedBtn.disabled = true;
      
      // Show divider and TOTP section
      divider.style.display = "block";
      totpSection.style.display = "block";
      
      // Start TOTP generation and progress bar
      startTOTPDisplay();
    }
  });
}

// Save seed button handler
document.getElementById("save-seed").addEventListener("click", () => {
  const seed = seedInput.value;
  
  // Don't save if button is disabled or it's just the masked value
  if (saveSeedBtn.disabled || (seedInput.classList.contains("masked") && seed.startsWith("*"))) {
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
  
  browser.storage.sync.set({ totpSeed: cleanSeed }).then(() => {
    alert("TOTP seed saved!");
    
    // Update UI to show masked seed
    seedInput.value = "*".repeat(Math.min(cleanSeed.length, 20));
    seedInput.classList.add("masked");
    
    // Disable save button since seed is now saved
    saveSeedBtn.classList.add("disabled");
    saveSeedBtn.disabled = true;
    
    // Show divider and TOTP section
    divider.style.display = "block";
    totpSection.style.display = "block";
    
    // Start TOTP generation and progress bar
    startTOTPDisplay();
  });
});

// Handle clicking on masked input to allow editing
seedInput.addEventListener("focus", () => {
  if (seedInput.classList.contains("masked")) {
    seedInput.value = "";
    seedInput.classList.remove("masked");
    seedInput.placeholder = "Enter new seed or leave empty to keep current";
    
    // Enable save button when user starts editing
    saveSeedBtn.classList.remove("disabled");
    saveSeedBtn.disabled = false;
  }
});

// Handle leaving the input field without typing anything
seedInput.addEventListener("blur", () => {
  // If the input is empty and we have a stored seed, revert to masked display
  if (!seedInput.value.trim() && currentSeed && !seedInput.classList.contains("masked")) {
    seedInput.value = "*".repeat(Math.min(currentSeed.length, 20));
    seedInput.classList.add("masked");
    seedInput.placeholder = "Enter seed";
    
    // Disable save button again
    saveSeedBtn.classList.add("disabled");
    saveSeedBtn.disabled = true;
  }
});

// Enable save button when user types in the input
seedInput.addEventListener("input", () => {
  if (!seedInput.classList.contains("masked")) {
    saveSeedBtn.classList.remove("disabled");
    saveSeedBtn.disabled = false;
  }
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
  totpInterval = setInterval(updateTOTPCode, 30000); // Update every 30 seconds
  progressInterval = setInterval(updateProgressBar, 100); // Update progress every 100ms
}

// Update TOTP code by asking background script
async function updateTOTPCode() {
  if (!currentSeed) return;
  
  try {
    const response = await browser.runtime.sendMessage({ action: "generateTOTP" });
    if (response && response.code) {
      totpCodeDisplay.textContent = response.code;
    } else {
      totpCodeDisplay.textContent = "ERROR";
    }
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