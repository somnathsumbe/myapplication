(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
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
      return JSON.parse(localStorage.getItem("nexusHub.preferences") || "{}");
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
      const icon = /^bi-[a-z0-9-]+$/.test(app.icon || "") ? app.icon : "bi-window";
      const color = /^tint-[a-z]+$/.test(app.color || "") ? app.color : "tint-lilac";
      return `<article class="app-card">
        <div class="app-card-top">
          <span class="app-icon ${color}"><i class="bi ${icon}" aria-hidden="true"></i></span>
        </div>
        <h3 class="app-name">${escapeHtml(app.name)}</h3>
        <p class="app-description">${escapeHtml(app.description || "")}</p>
        <div class="app-card-footer">
          <a class="launch-button" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open application <i class="bi bi-arrow-up-right" aria-hidden="true"></i></a>
          <button class="copy-link-button" type="button" data-copy-link="${escapeHtml(url)}" aria-label="Copy ${escapeHtml(app.name)} link"><i class="bi bi-copy" aria-hidden="true"></i><span>Copy link</span></button>
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
    const preferences = readPreferences();

    if (preferences.darkMode) {
      document.body.classList.add("dark-mode");
      themeToggle.innerHTML = '<i class="bi bi-sun"></i>';
    }

    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const darkMode = document.body.classList.contains("dark-mode");
      const updatedPreferences = readPreferences();
      updatedPreferences.darkMode = darkMode;
      writePreferences(updatedPreferences);
      themeToggle.innerHTML = `<i class="bi ${darkMode ? "bi-sun" : "bi-moon-stars"}"></i>`;
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

    mobileMenu.addEventListener("click", () => sidebar.classList.toggle("is-open"));
    document.addEventListener("click", (event) => {
      if (window.innerWidth <= 900 && !event.target.closest("#sidebar") && !event.target.closest("#mobileMenu")) {
        sidebar.classList.remove("is-open");
      }
    });
    loadApplications();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
