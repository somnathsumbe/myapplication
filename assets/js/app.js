(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const iconPaths = {
    "bi-person-badge": '<rect x="4" y="3" width="16" height="18" rx="3"></rect><circle cx="12" cy="9" r="2.5"></circle><path d="M8 17c.7-2 2-3 4-3s3.3 1 4 3"></path>',
    "bi-wallet2": '<path d="M4 7.5h14a2 2 0 0 1 2 2V19H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12"></path><path d="M16 12h4"></path><circle cx="16" cy="12" r=".6"></circle>',
    "bi-stars": '<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"></path><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"></path><path d="m5 3 .6 1.4L7 5l-1.4.6L5 7l-.6-1.4L3 5l1.4-.6L5 3Z"></path>',
    "bi-book": '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"></path><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8"></path>',
    "bi-building": '<rect x="4" y="3" width="16" height="18" rx="1.5"></rect><path d="M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2M10 21v-3h4v3"></path>',
    "bi-code-slash": '<path d="m8 8-4 4 4 4m8-8 4 4-4 4m-2-10-4 12"></path>',
    "bi-basket": '<path d="m4 10 2 10h12l2-10H4Z"></path><path d="m8 10 4-6 4 6m-4 2v5m-4-5 1 5m7-5-1 5"></path>',
    "bi-book-half": '<path d="M12 6.5A5 5 0 0 0 4 5v14a5 5 0 0 1 8 1.5V6.5Z"></path><path d="M12 6.5A5 5 0 0 1 20 5v14a5 5 0 0 0-8 1.5V6.5Z"></path>',
    "bi-trophy": '<path d="M8 4h8v4a4 4 0 0 1-8 0V4Zm4 8v5m-4 3h8m-7-3h6"></path><path d="M8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4"></path>',
    "bi-person-workspace": '<rect x="3" y="4" width="18" height="13" rx="2"></rect><path d="M8 21h8m-4-4v4"></path><circle cx="12" cy="9" r="2"></circle><path d="M8.5 14c.5-1.5 1.7-2.2 3.5-2.2s3 .7 3.5 2.2"></path>',
    "bi-mortarboard": '<path d="m2 9 10-5 10 5-10 5L2 9Z"></path><path d="M6 11v5c3.5 2.5 8.5 2.5 12 0v-5m4-2v6"></path>',
    "bi-hospital": '<path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M3 21h18"></path><path d="M10 7h4m-2-2v4m-4 4h1m6 0h1m-8 4h1m6 0h1m-4 5v-4"></path>',
    "bi-grid": '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"></rect><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"></rect><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"></rect><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"></rect>',
    "bi-moon-stars": '<path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z"></path><path d="m17 3 .5 1.5L19 5l-1.5.5L17 7l-.5-1.5L15 5l1.5-.5L17 3Zm3 5 .4 1.1L21.5 9.5l-1.1.4L20 11l-.4-1.1-1.1-.4 1.1-.4L20 8Z"></path>',
    "bi-sun": '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>',
    "bi-arrow-up-right": '<path d="M7 17 17 7M8 7h9v9"></path>',
    "bi-copy": '<rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"></path>',
    "bi-window": '<rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M3 9h18m-14-3h.1m3 0h.1"></path>'
  };
  const svgIcon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7">${iconPaths[name] || iconPaths["bi-window"]}</g></svg>`;
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  const validUrl = (value) => {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  };

  function readPreferences() {
    try {
      const preferences = JSON.parse(localStorage.getItem("nexusHub.preferences") || "{}");
      return preferences && typeof preferences === "object" ? preferences : {};
    } catch {
      return {};
    }
  }

  function writePreferences(preferences) {
    localStorage.setItem("nexusHub.preferences", JSON.stringify(preferences));
  }

  function showStatus(message, isError = false) {
    const status = $("#appStatus");
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  }

  function renderApplications(applications) {
    $("#appsGrid").innerHTML = applications.map((app) => {
      const url = validUrl(app.url);
      if (!url || !app.name) return "";
      const color = /^tint-[a-z]+$/.test(app.color || "") ? app.color : "tint-lilac";
      return `<article class="app-card">
        <div class="app-card-top">
          <span class="app-icon ${color}">${svgIcon(app.icon)}</span>
        </div>
        <h3 class="app-name">${escapeHtml(app.name)}</h3>
        <p class="app-description">${escapeHtml(app.description || "")}</p>
        <div class="app-card-footer">
          <a class="launch-button" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open application ${svgIcon("bi-arrow-up-right")}</a>
          <button class="copy-link-button" type="button" data-copy-link="${escapeHtml(url)}" aria-label="Copy ${escapeHtml(app.name)} link">${svgIcon("bi-copy")}<span>Copy link</span></button>
        </div>
      </article>`;
    }).join("");
  }

  async function copyLink(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      return;
    }

    const input = document.createElement("textarea");
    input.value = url;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    try {
      if (!document.execCommand("copy")) throw new Error("Clipboard copy was not permitted.");
    } finally {
      input.remove();
    }
  }

  async function loadApplications() {
    try {
      const response = await fetch("data/applications.json", { cache: "no-cache" });
      if (!response.ok) throw new Error(`Application list request failed (${response.status}).`);
      const applications = await response.json();
      if (!Array.isArray(applications)) throw new Error("Application list has an invalid format.");
      renderApplications(applications);
    } catch (error) {
      showStatus("Applications could not be loaded. Refresh the page to try again.", true);
      console.error("Unable to load applications.", error);
    }
  }

  function init() {
    const themeToggle = $("#themeToggle");
    const sidebar = $("#sidebar");
    const mobileMenu = $("#mobileMenu");
    const installButton = $("#installButton");
    const preferences = readPreferences();
    let installPrompt = null;

    if (preferences.darkMode) {
      document.body.classList.add("dark-mode");
      themeToggle.innerHTML = svgIcon("bi-sun");
    }

    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const darkMode = document.body.classList.contains("dark-mode");
      const updatedPreferences = readPreferences();
      updatedPreferences.darkMode = darkMode;
      writePreferences(updatedPreferences);
      themeToggle.innerHTML = svgIcon(darkMode ? "bi-sun" : "bi-moon-stars");
    });

    $("#appsGrid").addEventListener("click", async (event) => {
      const button = event.target.closest("[data-copy-link]");
      if (!button) return;
      try {
        await copyLink(button.dataset.copyLink);
        showStatus("Application link copied to clipboard.");
      } catch (error) {
        showStatus("Could not copy the link. Check your browser clipboard permissions.", true);
        console.error("Unable to copy application link.", error);
      }
    });

    mobileMenu.addEventListener("click", () => {
      const isOpen = !sidebar.classList.contains("is-open");
      sidebar.classList.toggle("is-open", isOpen);
      mobileMenu.setAttribute("aria-expanded", String(isOpen));
      mobileMenu.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });
    document.addEventListener("click", (event) => {
      if (window.innerWidth <= 900 && !event.target.closest("#sidebar") && !event.target.closest("#mobileMenu")) {
        sidebar.classList.remove("is-open");
        mobileMenu.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-label", "Open navigation");
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && sidebar.classList.contains("is-open")) {
        sidebar.classList.remove("is-open");
        mobileMenu.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-label", "Open navigation");
        mobileMenu.focus();
      }
    });

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      installPrompt = event;
      installButton.hidden = false;
    });
    installButton.addEventListener("click", async () => {
      if (!installPrompt) return;
      const promptEvent = installPrompt;
      installPrompt = null;
      try {
        await promptEvent.prompt();
        await promptEvent.userChoice;
      } catch (error) {
        showStatus("The app could not be installed right now. Try your browser's install option.", true);
        console.error("Unable to show the app install prompt.", error);
      } finally {
        installButton.hidden = true;
      }
    });
    window.addEventListener("appinstalled", () => {
      installPrompt = null;
      installButton.hidden = true;
    });

    loadApplications();
  }

  document.addEventListener("DOMContentLoaded", init);

  if ("serviceWorker" in navigator && ["http:", "https:"].includes(location.protocol)) {
    const wasControlled = Boolean(navigator.serviceWorker.controller);
    let refreshingForUpdate = false;
    if (wasControlled) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshingForUpdate) return;
        refreshingForUpdate = true;
        window.location.reload();
      });
    }
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" })
        .catch((error) => console.error("Service worker registration failed.", error));
    });
  }
})();
