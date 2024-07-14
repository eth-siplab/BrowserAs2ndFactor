window.addEventListener("load", () => {
  let field: HTMLInputElement | null = null;
  let button: HTMLElement | null = null;
  if (location.href.includes("https://access.ethz.ch/idpauthapp")) {
    const fieldId =
      "com.siemens.dxa.applications.web.authn.challenging.response2";
    field = document.getElementsByName(fieldId).item(0) as HTMLInputElement;
    const buttonId = "Login";
    const button_list = document.getElementsByName(buttonId);
    console.log(button_list);
    for (let i = 0; i < button_list.length; i++) {
      if (
        button_list.item(i).getAttribute("type") === "submit" &&
        button_list.item(i).getAttribute("class") === "icon"
      ) {
        button = button_list.item(i);
      }
    }
  } else if (location.href.includes("https://idbdfedin16.ethz.ch")) {
    const fieldId = "challengeQuestionInput";
    field = document.getElementById(fieldId) as HTMLInputElement;
    const buttonId = "submitButton";
    button = document.getElementById(buttonId);
  }
  let active: boolean = true;

  if (field && button && active) {
    chrome.runtime.sendMessage({ action: "generateTOTP" }, (response) => {
      if (response && response.code) {
        field!.value = response.code;
        button!.click();
        active = false;
        setTimeout(() => (active = true), 2000);
      }
    });
  }
});
