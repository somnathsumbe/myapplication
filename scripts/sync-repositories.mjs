import { readFile, writeFile } from "node:fs/promises";

const owner = process.env.GITHUB_OWNER || "somnathsumbe";
const token = process.env.GITHUB_TOKEN;
const dataDirectory = new URL("../data/", import.meta.url);
const applicationsPath = new URL("../data/applications.json", import.meta.url);
const statusPath = new URL("../data/repository-sync-status.json", import.meta.url);
const startedAt = new Date().toISOString();

async function writeStatus(status) {
  await writeFile(statusPath, `${JSON.stringify(status, null, 2)}\\n`);
}

async function fetchOwnedPublicRepositories() {
  const repositories = [];
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  for (let page = 1; ; page += 1) {
    const endpoint = new URL(`https://api.github.com/users/${owner}/repos`);
    endpoint.search = new URLSearchParams({
      type: "owner", sort: "updated", direction: "desc",
      per_page: "100", page: String(page),
    });
    const response = await fetch(endpoint, { headers });
    if (!response.ok) {
      const details = await response.text();
      throw new Error(`GitHub API failed (${response.status}): ${details.slice(0, 500)}`);
    }
    const batch = await response.json();
    repositories.push(...batch.filter((repo) => !repo.private));
    if (batch.length < 100) break;
  }
  return repositories;
}

const categoryDefaults = [
  { match: /finance|ledger|calculator|payment|money/i, category: "Finance", icon: "bi-wallet2", color: "tint-teal" },
  { match: /education|exam|learn|study|story|school|revision/i, category: "Education", icon: "bi-book", color: "tint-violet" },
  { match: /business|store|shop|food|ghar|pharal|recipe/i, category: "Business", icon: "bi-building", color: "tint-amber" },
  { match: /interview|code|dev|coder|software/i, category: "Development", icon: "bi-code-slash", color: "tint-blue" },
  { match: /task|tracker|grocery|chess|productivity/i, category: "Productivity", icon: "bi-grid", color: "tint-sky" },
];

function defaultsFor(name) {
  return categoryDefaults.find((item) => item.match.test(name))
    ?? { category: "Other", icon: "bi-window", color: "tint-mint" };
}

function toId(name) {
  return name.normalize("NFKD").replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function runSync() {
  if (!token) throw new Error("GITHUB_TOKEN is required.");
  const existing = JSON.parse(await readFile(applicationsPath, "utf8"));
  if (!Array.isArray(existing)) throw new TypeError("data/applications.json must contain a JSON array.");

  const byRepository = new Map(existing.filter((app) => app.repositoryUrl)
    .map((app) => [app.repositoryUrl.replace(/\\.git$/, "").toLowerCase(), app]));
  const seenIds = new Set(existing.map((app) => app.id));
  const repositories = await fetchOwnedPublicRepositories();
  let addedCount = 0;
  let updatedCount = 0;

  for (const repo of repositories) {
    const repositoryUrl = repo.html_url.replace(/\\.git$/, "");
    const key = repositoryUrl.toLowerCase();
    const current = byRepository.get(key);
    const metadata = {
      repositoryUrl,
      githubUpdatedAt: repo.updated_at,
      defaultBranch: repo.default_branch,
      stars: repo.stargazers_count,
      fork: repo.fork,
    };

    if (current) {
      const changed = Object.entries(metadata).some(([field, value]) => current[field] !== value);
      Object.assign(current, metadata);
      if (changed) updatedCount += 1;
      continue;
    }

    const defaults = defaultsFor(repo.name);
    let id = toId(repo.name) || `repository-${repo.id}`;
    if (seenIds.has(id)) id = `${id}-${repo.id}`;
    seenIds.add(id);
    const homepage = repo.homepage?.trim();

    existing.push({
      id,
      name: repo.name,
      description: repo.description || `GitHub repository for ${repo.name}.`,
      category: defaults.category,
      url: homepage || repositoryUrl,
      repositoryUrl,
      ...(!homepage ? { linkType: "repository" } : {}),
      icon: defaults.icon,
      color: defaults.color,
      githubUpdatedAt: repo.updated_at,
      defaultBranch: repo.default_branch,
      stars: repo.stargazers_count,
      fork: repo.fork,
    });
    addedCount += 1;
  }

  await writeFile(applicationsPath, `${JSON.stringify(existing, null, 2)}\\n`);
  const completedAt = new Date().toISOString();
  const status = {
    status: "success",
    owner,
    startedAt,
    completedAt,
    lastSuccessfulRunAt: completedAt,
    addedCount,
    updatedCount,
    totalRepositories: repositories.length,
    dashboardEntries: existing.length,
    error: null,
  };
  await writeStatus(status);
  console.log(`Sync successful: ${repositories.length} public repositories; ${addedCount} added; ${updatedCount} updated.`);
}

try {
  await runSync();
} catch (error) {
  const message = String(error?.message || error).slice(0, 1000);
  const completedAt = new Date().toISOString();
  let previous = {};
  try { previous = JSON.parse(await readFile(statusPath, "utf8")); } catch { /* First run */ }
  await writeStatus({
    status: "failed",
    owner,
    startedAt,
    completedAt,
    lastSuccessfulRunAt: previous.lastSuccessfulRunAt || null,
    addedCount: 0,
    updatedCount: 0,
    totalRepositories: previous.totalRepositories ?? null,
    dashboardEntries: previous.dashboardEntries ?? null,
    error: message,
  });
  console.error(message);
  process.exitCode = 1;
}
