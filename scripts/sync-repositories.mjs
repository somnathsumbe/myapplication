import { readFile, writeFile } from "node:fs/promises";

const owner = process.env.GITHUB_OWNER || "somnathsumbe";
const token = process.env.GITHUB_TOKEN;
const applicationsPath = new URL("../data/applications.json", import.meta.url);
const statusPath = new URL("../data/repository-sync-status.json", import.meta.url);
const startedAt = new Date().toISOString();

async function writeStatus(status) {
  await writeFile(statusPath, `${JSON.stringify(status, null, 2)}\n`);
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

async function verifyWebsiteUrl(candidate) {
  if (!candidate) return null;
  let url;
  try {
    url = new URL(candidate);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  } catch {
    return null;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "myapplication-repository-link-check/1.0" },
    });
    return response.ok ? candidate : null;
  } catch {
    return null;
  }
}

async function findVerifiedWebsite(repo, current) {
  const repositoryUrl = repo.html_url.replace(/\.git$/, "");
  const candidates = [
    repo.homepage?.trim(),
    current && current.linkType !== "repository" && current.url !== repositoryUrl ? current.url : null,
    repo.has_pages ? `https://${owner}.github.io/${repo.name}/` : null,
  ].filter((value, index, all) => value && all.indexOf(value) === index);

  for (const candidate of candidates) {
    const verified = await verifyWebsiteUrl(candidate);
    if (verified) return verified;
  }
  return null;
}

const categoryDefaults = [
  { match: /finance|ledger|calculator|payment|money/i, category: "Finance", icon: "bi-wallet2", color: "tint-teal" },
  { match: /ai[-_ ]?master[-_ ]?class|education|exam|learn|study|story|school|revision/i, category: "Education", icon: "bi-book", color: "tint-violet" },
  { match: /business|store|shop|food|ghar|pharal|recipe/i, category: "Business", icon: "bi-building", color: "tint-amber" },
  { match: /interview|code|dev|coder|software/i, category: "Development", icon: "bi-code-slash", color: "tint-blue" },
  { match: /task|tracker|grocery|chess|productivity/i, category: "Productivity", icon: "bi-grid", color: "tint-sky" },
];

function defaultsFor(name) {
  return categoryDefaults.find((item) => item.match.test(name))
    ?? { category: "Other", icon: "bi-window", color: "tint-mint" };
}

function displayNameFor(name) {
  if (/^ai[-_ ]?master[-_ ]?class$/i.test(name)) return "AI Master Class";
  return name.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toId(name) {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function runSync() {
  if (!token) throw new Error("GITHUB_TOKEN is required.");
  let existing = JSON.parse(await readFile(applicationsPath, "utf8"));
  if (!Array.isArray(existing)) throw new TypeError("data/applications.json must contain a JSON array.");

  const byRepository = new Map(existing.filter((app) => app.repositoryUrl)
    .map((app) => [app.repositoryUrl.replace(/\.git$/, "").toLowerCase(), app]));
  const seenIds = new Set(existing.map((app) => app.id));
  const repositories = await fetchOwnedPublicRepositories();

  // Remove stale dashboard cards for repositories that no longer exist as public
  // repositories owned by this account. Keep manually-managed cards without repositoryUrl.
  const activeRepositoryUrls = new Set(repositories.map((repo) =>
    repo.html_url.replace(/\\.git$/, "").toLowerCase()
  ));
  const previousEntryCount = existing.length;
  existing = existing.filter((app) => {
    if (!app.repositoryUrl) return true;
    return activeRepositoryUrls.has(app.repositoryUrl.replace(/\\.git$/, "").toLowerCase());
  });
  const removedCount = previousEntryCount - existing.length;

  let addedCount = 0;
  let updatedCount = 0;

  let verifiedWebsiteCount = 0;
  let unavailableWebsiteCount = 0;

  for (const repo of repositories) {
    const repositoryUrl = repo.html_url.replace(/\.git$/, "");
    const key = repositoryUrl.toLowerCase();
    const current = byRepository.get(key);
    const websiteUrl = await findVerifiedWebsite(repo, current);
    const verifiedAt = new Date().toISOString();
    const metadata = {
      repositoryUrl,
      githubUpdatedAt: repo.updated_at,
      defaultBranch: repo.default_branch,
      stars: repo.stargazers_count,
      fork: repo.fork,
      websiteStatus: websiteUrl ? "available" : "unavailable",
      websiteVerifiedAt: verifiedAt,
    };

    if (websiteUrl) {
      metadata.url = websiteUrl;
      metadata.linkType = undefined;
      metadata.pagesUrl = undefined;
      verifiedWebsiteCount += 1;
    } else {
      metadata.url = repositoryUrl;
      metadata.linkType = "repository";
      metadata.pagesUrl = null;
      unavailableWebsiteCount += 1;
    }

    if (current) {
      const before = JSON.stringify(current);
      Object.assign(current, metadata);
      if (current.linkType === undefined) delete current.linkType;
      if (current.pagesUrl === undefined) delete current.pagesUrl;
      if (JSON.stringify(current) !== before) updatedCount += 1;
      continue;
    }

    const defaults = defaultsFor(repo.name);
    let id = toId(repo.name) || `repository-${repo.id}`;
    if (seenIds.has(id)) id = `${id}-${repo.id}`;
    seenIds.add(id);

    existing.push({
      id,
      name: displayNameFor(repo.name),
      description: repo.description || `GitHub repository for ${repo.name}.`,
      category: defaults.category,
      ...metadata,
      icon: defaults.icon,
      color: defaults.color,
    });
    addedCount += 1;
  }

  await writeFile(applicationsPath, `${JSON.stringify(existing, null, 2)}\n`);
  const completedAt = new Date().toISOString();
  const status = {
    status: "success",
    owner,
    startedAt,
    completedAt,
    lastSuccessfulRunAt: completedAt,
    addedCount,
    updatedCount,
    removedCount,
    totalRepositories: repositories.length,
    dashboardEntries: existing.length,
    verifiedWebsiteCount,
    unavailableWebsiteCount,
    error: null,
  };
  await writeStatus(status);
  console.log(`Sync successful: ${repositories.length} public repositories; ${addedCount} added; ${updatedCount} updated; ${removedCount} removed.`);
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
