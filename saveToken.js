console.log(" saveToken.js running...");

try {
  const token = localStorage.getItem("token");
  if (token) {
    chrome.storage.local.set({ token }, () => {
      console.log(" Token saved to chrome.storage:", token);
    });
  } else {
    console.warn(" No token found in localStorage yet");
  }
} catch (err) {
  console.error(" Error reading token:", err);
}
