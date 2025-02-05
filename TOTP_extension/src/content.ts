window.addEventListener("load", () => {
  let field: HTMLInputElement | null = null;
  let button: HTMLElement | null = null;
  let active: boolean = true;

  const getInputByName = (name: string): HTMLInputElement | null => 
    document.getElementsByName(name)[0] as HTMLInputElement || null;

  const getSubmitButton = (): HTMLElement | null => 
    Array.from(document.getElementsByName("Login")).find(
      btn => btn.getAttribute("type") === "submit" &&
             btn.getAttribute("class") === "icon"
    ) as HTMLElement | null;

  const processTOTP = (field: HTMLInputElement | null, button: HTMLElement | null) => {
    if (field && button && active) {
      chrome.runtime.sendMessage({ action: "generateTOTP" }, (response) => {
        if (response?.code) {
          field.value = response.code;
          button.click();
          active = false;
          setTimeout(() => (active = true), 2000);
        }
      });
    }
  };


  if (location.href.includes("https://access.ethz.ch/idpauthapp")) {
    const field_id_pw  = "com.siemens.dxa.applications.web.authn.challenging.response";
    const field_id_otp = "com.siemens.dxa.applications.web.authn.challenging.response2";

    if ((field = getInputByName(field_id_pw)) != null) {
      setTimeout((field) => {
        if (field!.matches(":-webkit-autofill")) {
          // cannot submit but at least allow for return
          field!.click();
        }
      }, 1000, field);
    }

    if ((field = getInputByName(field_id_otp)) != null) {
      button = getSubmitButton();
      processTOTP(field, button);
    }
  } else if (location.href.includes("https://idbdfedin16.ethz.ch")) {
    field = document.getElementById("challengeQuestionInput") as HTMLInputElement;
    button = document.getElementById("submitButton");
    processTOTP(field, button);
  }
});
