window.addEventListener("load", () => {
  const fieldId = "challengeQuestionInput";
  const field: HTMLInputElement = document.getElementById(
    fieldId
  ) as HTMLInputElement;
  const buttonId = "submitButton";
  const button = document.getElementById(buttonId);
  let active: boolean = true;

  if (field && button && active) {
    chrome.runtime.sendMessage({ action: "generateTOTP" }, (response) => {
      if (response && response.code) {
        field.value = response.code;
        button.click();
        active = false;
        setTimeout(() => (active = true), 2000);
      }
    });
  }
});
