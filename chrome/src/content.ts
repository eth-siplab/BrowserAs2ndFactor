type TotpField = HTMLInputElement & { form: HTMLFormElement | null };

const DXA_RESPONSE = "com.siemens.dxa.applications.web.authn.challenging.response";
const DXA_RESPONSE_2 = `${DXA_RESPONSE}2`;
const OTP_TEXT = /(?:one[- ]time(?:\s+(?:password|code))?|totp|otp|2fa|two[- ]factor|second[- ]factor|passcode|verification code|security code|authentication code|authenticator code|token code)/i;

function fieldDescription(field: HTMLInputElement): string {
  const id = CSS.escape(field.id || "");
  const label = id ? document.querySelector(`label[for="${id}"]`)?.textContent : "";

  return [
    field.name,
    field.id,
    field.autocomplete,
    field.placeholder,
    field.getAttribute("aria-label"),
    field.getAttribute("label"),
    label,
  ].filter(Boolean).join(" ");
}

function findFidoTotpField(): TotpField | null {
  const candidates = Array.from(document.querySelectorAll<HTMLInputElement>("input"));
  const usable = candidates.filter((field) => {
    const type = (field.type || "text").toLowerCase();
    if (field.disabled || field.readOnly || type === "hidden") return false;
    if (type !== "password") return true;
    return field.autocomplete !== "current-password" && OTP_TEXT.test(fieldDescription(field));
  });

  const explicit = usable.find((field) =>
    field.name === DXA_RESPONSE_2 ||
    field.autocomplete === "one-time-code" ||
    OTP_TEXT.test(fieldDescription(field))
  );
  if (explicit) return explicit as TotpField;

  // Some DXA templates reuse the generic response name for the second step.
  // Only accept it when the surrounding page clearly describes an OTP challenge.
  const pageText = document.body?.innerText || "";
  return (usable.find((field) =>
    field.name === DXA_RESPONSE && OTP_TEXT.test(pageText)
  ) as TotpField | undefined) || null;
}

function setFieldValue(field: HTMLInputElement, code: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (setter) setter.call(field, code);
  else field.value = code;

  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

function submitFieldForm(field: TotpField): void {
  const form = field.form || field.closest("form");
  if (!form) return;

  if (typeof form.requestSubmit === "function") form.requestSubmit();
  else form.submit();
}

function processTOTP(field: TotpField | null): void {
  if (!field) return;

  chrome.runtime.sendMessage({ action: "generateTOTP" }, (response) => {
    const code = response?.code;
    if (typeof code !== "string" || !/^\d{6}$/.test(code)) return;

    setFieldValue(field, code);
    submitFieldForm(field);
  });
}

function initialize(): void {
  if (location.href.startsWith("https://access.ethz.ch/fidoapp/")) {
    processTOTP(findFidoTotpField());
    return;
  }

  if (location.href.startsWith("https://access.ethz.ch/idpauthapp/")) {
    const passwordField = document.getElementsByName(DXA_RESPONSE)[0] as HTMLInputElement | undefined;
    if (passwordField) {
      setTimeout(() => {
        if (passwordField.matches(":-webkit-autofill")) passwordField.click();
      }, 1000);
    }

    processTOTP(document.getElementsByName(DXA_RESPONSE_2)[0] as TotpField | null);
    return;
  }

  if (location.hostname === "idbdfedin16.ethz.ch") {
    processTOTP(document.getElementById("challengeQuestionInput") as TotpField | null);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
  initialize();
}
