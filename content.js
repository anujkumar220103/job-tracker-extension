console.log(" Job Tracker content script running...");
console.warn(" Content script injected:", window.location.href);


// function safeSendMessage(payload, retry = 5) {
//   if (chrome?.runtime?.id) {
//     chrome.runtime.sendMessage(payload);
//     return;
//   }

//   if (retry > 0) {
//     console.warn(` Runtime unavailable. Retrying in 300ms... (${retry})`);
//     setTimeout(() => safeSendMessage(payload, retry - 1), 300);
//   } else {
//     console.error(" Failed to send — chrome.runtime unavailable.");
//   }
// }
function cleanLocation(rawText) {
  if (!rawText) return "Unknown";

  // Split by dot, middle-dot, bullet, or pipe
  const parts = rawText.split(/·|•|\||,/);

  // If first item contains commas → return full city string
  if (rawText.includes(",")) {
    const match = rawText.match(/^.*?,.*?(?=·|•|\||$)/);
    return match ? match[0].trim() : parts[0].trim();
  }

  return parts[0].trim();
}


function getText1(selectors) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);

    if (!el) continue;

    // If the text is directly available
    // if (el.innerText?.trim()) return el.innerText.trim();

    // If div has multiple nested spans → get first meaningful span
    const firstSpan = el.querySelector("span span, span:first-child");
    if (firstSpan?.innerText?.trim()) return firstSpan.innerText.trim();
  }
  return "Unknown";
}


// Confirm chrome runtime exists
if (!chrome?.runtime?.id) {
  console.warn(" Chrome API not ready yet. Retrying...");
}
const trackJobApplication = (token) => {
  const domain = window.location.hostname;
  const link = window.location.href;
  const date = new Date().toISOString();

  // Helper to find text by trying multiple selectors
  function getText(selectors) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText.trim().length > 0) {
        return el.innerText.trim();
      }
    }
    return "Unknown";
  }

  // Try common selectors for position, company, location
  const position = getText([
    "h1",
    "h2",
    ".job-title",
    ".topcard__title",
    ".internship-title",
    ".profile-header h1",
  ]);

  const company = getText([
    "div[aria-label='Company']",
    ".topcard__org-name-link",
    ".company-name",
    ".job-card-container__company-name",
    ".job-card-list__company-name",
    ".internship-company-name",
    ".profile-header .company",
    "div.company .heading_6.company_name",
    ".org_name ng-star-inserted",
    ".job-details-jobs-unified-top-card__company-name a"
  ]);

  // const location = getText([
  //   "span[aria-label='Location']",
  //   ".topcard__flavor--bullet",
  //   ".job-card-container__metadata-item",
  //   ".job-card-list__location",
  //   ".internship-location",
  //   ".location",
  //   "#location_names",
  //   ".job-details-jobs-unified-top-card__primary-description-container"
  // ]);
// const location = getText1([
//   "span[aria-label='Location']",
//   ".topcard__flavor--bullet",
//   ".job-card-container__metadata-item",
//   ".job-card-list__location",
//   ".internship-location",
//   ".location",
//   "#location_names",
//   ".job-details-jobs-unified-top-card__primary-description-container"
// ]);
  const rawLocation = getText1([
  "span[aria-label='Location']",
  ".topcard__flavor--bullet",
  ".job-card-container__metadata-item",
  ".job-card-list__location",
  ".internship-location",
  ".location",
  "#location_names",
  ".job-details-jobs-unified-top-card__primary-description-container"
]);

const location = cleanLocation(rawLocation);


  const job = {
    position,
    company,
    location,
    status: "applied",
    link,
    domain,
    date,
  };

  
  // Send to background script
  // chrome.runtime.sendMessage({ type: "LOG_JOB", data: job, token });
  // safeSendMessage({ type: "LOG_JOB", data: job, token });
  if (chrome?.runtime?.id) {
  chrome.runtime.sendMessage({ type: "LOG_JOB", data: job, token });
} else {
  console.warn(" Extension context lost. Message skipped.");
}

  console.log(" Job collected:", job);
  // console.log("sdfd"+message.type)
};

// Get token from chrome.storage.local then attach click listener
chrome.storage.local.get("token", ({ token }) => {
  if (!token) {
    console.warn(" No token found. Please log in to your Job Tracker app first.");
    return;
  }

  document.addEventListener("click", (e) => {
    const text = e.target.innerText?.toLowerCase() || "";
    const buttonText = e.target.closest("button")?.innerText.toLowerCase() || "";

    if (text.includes("apply") || buttonText.includes("apply")||text.includes("easy apply") || buttonText.includes("easy apply")) {
      trackJobApplication(token);
    }
  });
});
