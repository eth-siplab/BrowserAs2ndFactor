console.log("ETH Extension: Content script loaded on", location.href);
console.log("ETH Extension: Document ready state:", document.readyState);
console.log("ETH Extension: User agent:", navigator.userAgent);

// Add immediate DOM inspection
console.log("ETH Extension: Initial DOM state:");
console.log("ETH Extension: All inputs:", document.querySelectorAll('input'));
console.log("ETH Extension: All buttons:", document.querySelectorAll('button'));
console.log("ETH Extension: All forms:", document.querySelectorAll('form'));

// Try multiple event listeners to catch different loading states
document.addEventListener("DOMContentLoaded", () => {
  console.log("ETH Extension: DOMContentLoaded fired");
});

window.addEventListener("load", () => {
  console.log("ETH Extension: Window load event fired, starting initialization");
  console.log("ETH Extension: Current URL:", window.location.href);
  console.log("ETH Extension: Document title:", document.title);
  let field = null;
  let button = null;
  let active = true;

  const getInputByName = (name) => {
    console.log("ETH Extension: getInputByName called with:", name);
    const elements = document.getElementsByName(name);
    console.log("ETH Extension: Found elements with name", name, ":", elements);
    const result = elements.length > 0 ? elements[0] : null;
    console.log("ETH Extension: getInputByName returning:", result);
    return result;
  };

  const getSubmitButton = () => {
    console.log("ETH Extension: getSubmitButton called");
    const buttons = Array.from(document.getElementsByName("Login"));
    console.log("ETH Extension: Found buttons with name 'Login':", buttons);
    
    buttons.forEach((btn, index) => {
      console.log(`ETH Extension: Button ${index}:`, {
        element: btn,
        type: btn.getAttribute("type"),
        class: btn.getAttribute("class"),
        id: btn.id,
        tagName: btn.tagName
      });
    });
    
    const result = buttons.find(
      btn => btn.getAttribute("type") === "submit" &&
             btn.getAttribute("class") === "icon"
    ) || null;
    console.log("ETH Extension: getSubmitButton returning:", result);
    return result;
  };

  const processTOTP = (field, form) => {
    console.log("ETH Extension: processTOTP called", { field: !!field, form: !!form, active });
    if (field && form && active) {
      console.log("ETH Extension: Sending message to background script");
      // Use sendMessage with async/await pattern for Firefox
      (async () => {
        try {
          const response = await browser.runtime.sendMessage({ action: "generateTOTP" });
          console.log("ETH Extension: Received response", response);
          if (response && response.code) {
            console.log("ETH Extension: Setting field value and submitting form");
            field.value = response.code;
            form.submit();
            active = false;
            setTimeout(() => (active = true), 2000);
          } else {
            console.log("ETH Extension: No code in response");
          }
        } catch (error) {
          console.error("ETH Extension: Error generating TOTP:", error);
        }
      })();
    } else {
      console.log("ETH Extension: Not processing - missing field, form, or not active");
    }
  };

  if (location.href.includes("https://access.ethz.ch/idpauthapp")) {
    console.log("ETH Extension: Processing access.ethz.ch page");
    console.log("ETH Extension: Full URL:", location.href);
    
    // Debug: Log all current DOM elements
    console.log("ETH Extension: All form elements on page:");
    document.querySelectorAll('input').forEach((input, index) => {
      console.log(`ETH Extension: Input ${index}:`, {
        element: input,
        name: input.name,
        id: input.id,
        type: input.type,
        value: input.value,
        placeholder: input.placeholder
      });
    });
    
    const field_id_pw = "com.siemens.dxa.applications.web.authn.challenging.response";
    const field_id_otp = "com.siemens.dxa.applications.web.authn.challenging.response2";

    console.log("ETH Extension: Looking for password field:", field_id_pw);
    field = getInputByName(field_id_pw);
    if (field != null) {
      console.log("ETH Extension: Found password field:", field);
      setTimeout((field) => {
        console.log("ETH Extension: Checking autofill state");
        if (field && field.matches(":-webkit-autofill")) {
          console.log("ETH Extension: Field is autofilled, clicking");
          field.click();
        } else {
          console.log("ETH Extension: Field is not autofilled");
        }
      }, 1000, field);
    } else {
      console.log("ETH Extension: Password field not found");
    }

    console.log("ETH Extension: Looking for OTP field:", field_id_otp);
    field = getInputByName(field_id_otp);
    if (field != null) {
      console.log("ETH Extension: Found OTP field:", field);
      const form = field.closest('form') || document.querySelector('form');
      if (form) {
        console.log("ETH Extension: Found form:", form);
        processTOTP(field, form);
      } else {
        console.log("ETH Extension: No form found for field");
      }
    } else {
      console.log("ETH Extension: OTP field not found");
      
      // Debug: Try alternative ways to find OTP field
      console.log("ETH Extension: Trying alternative selectors for OTP field");
      const altField1 = document.querySelector('input[type="text"]');
      const altField2 = document.querySelector('input[type="password"]');
      const altField3 = document.getElementById(field_id_otp);
      console.log("ETH Extension: Alternative fields found:", { altField1, altField2, altField3 });
    }
  } else if (location.href.includes("https://idbdfedin16.ethz.ch")) {
    console.log("ETH Extension: Processing idbdfedin16.ethz.ch page");
    console.log("ETH Extension: Full URL:", location.href);
    
    // Debug: Log all current DOM elements immediately
    console.log("ETH Extension: Initial DOM scan for idbdfedin16.ethz.ch:");
    document.querySelectorAll('input').forEach((input, index) => {
      console.log(`ETH Extension: Input ${index}:`, {
        element: input,
        name: input.name,
        id: input.id,
        type: input.type,
        value: input.value,
        placeholder: input.placeholder,
        className: input.className
      });
    });
    
    document.querySelectorAll('button').forEach((button, index) => {
      console.log(`ETH Extension: Button ${index}:`, {
        element: button,
        id: button.id,
        type: button.type,
        name: button.name,
        className: button.className,
        textContent: button.textContent
      });
    });
    
    // Function to wait for elements to appear (for dynamic content)
    const waitForElements = () => {
      return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 20; // 10 seconds total
        
        const checkElements = () => {
          attempts++;
          console.log(`ETH Extension: Attempt ${attempts}/${maxAttempts} to find elements`);
          
          const field = document.getElementById("challengeQuestionInput");
          const form = field ? field.closest('form') : document.querySelector('form');
          
          console.log("ETH Extension: Checking for elements", { 
            field: !!field, 
            form: !!form,
            fieldId: field?.id,
            formId: form?.id,
            fieldType: field?.type,
            fieldTagName: field?.tagName,
            formTagName: form?.tagName
          });
          
          // Also try alternative selectors
          const altInputs = document.querySelectorAll('input[type="text"], input[type="password"], input');
          const allForms = document.querySelectorAll('form');
          
          console.log("ETH Extension: Alternative elements found:", {
            inputs: altInputs.length,
            forms: allForms.length
          });
          
          if (field && form) {
            console.log("ETH Extension: Found field and form!");
            resolve({ field, form });
          } else if (attempts >= maxAttempts) {
            console.log("ETH Extension: Max attempts reached, giving up");
            resolve({ field: null, form: null });
          } else {
            // Try again after a short delay
            setTimeout(checkElements, 500);
          }
        };
        
        checkElements();
      });
    };
    
    // Wait for elements and then process
    waitForElements().then(({ field, form }) => {
      if (field && form) {
        console.log("ETH Extension: Processing TOTP with found elements");
        processTOTP(field, form);
      } else {
        console.log("ETH Extension: Could not find required elements after waiting");
        
        // Debug: log all available elements
        const allInputs = document.querySelectorAll('input');
        const allForms = document.querySelectorAll('form');
        console.log("ETH Extension: Final scan - Available inputs:", Array.from(allInputs).map(input => ({
          id: input.id,
          name: input.name,
          type: input.type,
          className: input.className,
          placeholder: input.placeholder
        })));
        console.log("ETH Extension: Final scan - Available forms:", Array.from(allForms).map(form => ({
          id: form.id,
          name: form.name,
          className: form.className,
          action: form.action
        })));
      }
    });
  } else {
    console.log("ETH Extension: URL not matched for processing, current URL:", location.href);
    console.log("ETH Extension: Expected patterns:");
    console.log("ETH Extension: - https://access.ethz.ch/idpauthapp");
    console.log("ETH Extension: - https://idbdfedin16.ethz.ch");
  }
});

// Add a MutationObserver to catch dynamically added content
console.log("ETH Extension: Setting up MutationObserver for dynamic content");
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      console.log("ETH Extension: DOM mutation detected, new nodes added:", mutation.addedNodes);
      
      // Check if any new input or button elements were added
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const newInputs = node.querySelectorAll ? node.querySelectorAll('input') : [];
          const newButtons = node.querySelectorAll ? node.querySelectorAll('button') : [];
          
          if (newInputs.length > 0 || newButtons.length > 0) {
            console.log("ETH Extension: New form elements detected:", { inputs: newInputs.length, buttons: newButtons.length });
          }
        }
      });
    }
  });
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log("ETH Extension: Content script initialization complete");