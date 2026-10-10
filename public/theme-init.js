// Applies the saved theme before the app hydrates, so a dark-theme user does
// not see a light first paint. The theme is owned by the account preference;
// this device copy is written by src/features/account/theme.ts.
(function () {
  try {
    if (window.localStorage.getItem("toonclip-theme") === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch {
    // Storage can be blocked; the light theme is the safe default.
  }
})();
