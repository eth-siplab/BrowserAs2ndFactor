document.getElementById("save-seed")?.addEventListener("click", () => {
  const seedInput = document.getElementById("totp-seed") as HTMLInputElement;
  const seed = seedInput.value;
  chrome.storage.sync.set({ totpSeed: seed }, () => {
    alert("TOTP seed saved!");
  });
});
