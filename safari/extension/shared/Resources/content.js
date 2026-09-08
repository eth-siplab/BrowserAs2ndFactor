(() => {
    if (window.__sa2fethLoaded) return;
    window.__sa2fethLoaded = true;

    const DXA_RESPONSE = "com.siemens.dxa.applications.web.authn.challenging.response";
    const OTP_TEXT = /(?:one[- ]time(?:\s+(?:password|code))?|totp|otp|2fa|two[- ]factor|second[- ]factor|passcode|verification code|security code|authentication code|authenticator code|token code)/i;
    const processedFields = new WeakSet();
    const clickedPasswordFields = new WeakSet();

    function describeField(field) {
        const label = field.id
            ? document.querySelector(`label[for="${CSS.escape(field.id)}"]`)?.textContent
            : "";
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

    function findFidoField() {
        const usable = Array.from(document.querySelectorAll("input")).filter((field) => {
            const type = (field.type || "text").toLowerCase();
            if (field.disabled || field.readOnly || type === "hidden") return false;
            if (type !== "password") return true;
            return field.autocomplete !== "current-password" && OTP_TEXT.test(describeField(field));
        });

        const explicit = usable.find((field) =>
            field.name === `${DXA_RESPONSE}2` ||
            field.autocomplete === "one-time-code" ||
            OTP_TEXT.test(describeField(field))
        );
        if (explicit) return explicit;

        const pageText = document.body?.innerText || "";
        return usable.find((field) => field.name === DXA_RESPONSE && OTP_TEXT.test(pageText)) || null;
    }

    function setFieldValue(field, code) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
        if (setter) setter.call(field, code);
        else field.value = code;
        field.dispatchEvent(new Event("input", { bubbles: true }));
        field.dispatchEvent(new Event("change", { bubbles: true }));
    }

    async function fillAndSubmit(field) {
        if (!field || processedFields.has(field)) return;
        processedFields.add(field);

        try {
            const response = await browser.runtime.sendMessage({ action: "generateTOTP" });
            if (!/^\d{6}$/.test(response?.code)) {
                processedFields.delete(field);
                return;
            }

            setFieldValue(field, response.code);
            const form = field.form || field.closest("form");
            if (!form) return;
            if (typeof form.requestSubmit === "function") form.requestSubmit();
            else form.submit();
        } catch (error) {
            processedFields.delete(field);
            console.error("Unable to autofill TOTP code:", error);
        }
    }

    function attemptAutofill() {
        if (location.href.startsWith("https://access.ethz.ch/fidoapp/")) {
            fillAndSubmit(findFidoField());
            return;
        }

        if (location.href.startsWith("https://access.ethz.ch/idpauthapp/")) {
            const passwordField = document.getElementsByName(DXA_RESPONSE)[0];
            if (passwordField && !clickedPasswordFields.has(passwordField)) {
                clickedPasswordFields.add(passwordField);
                setTimeout(() => {
                    if (passwordField.matches(":-webkit-autofill")) passwordField.click();
                }, 1000);
            }
            fillAndSubmit(document.getElementsByName(`${DXA_RESPONSE}2`)[0]);
            return;
        }

        if (location.hostname === "idbdfedin16.ethz.ch") {
            fillAndSubmit(document.getElementById("challengeQuestionInput"));
        }
    }

    attemptAutofill();
    const observer = new MutationObserver(attemptAutofill);
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();
