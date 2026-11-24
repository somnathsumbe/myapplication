import { readFile, writeFile } from "node:fs/promises";

const owner = process.env.GITHUB_OWNER || "somnathsumbe";
const token = process.env.GITHUB_TOKEN;

if (!token) {
  throw new Error("GITHUB_TOKEN is required. Run this script inside GitHub Actions.");
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
};

async function fetchOwnedPublicRepositories() {
  const repositories = [];

  for (let page = 1; ; page += 1) {
    const endpoint = new URL(`https://api.github.com/users/${owner}/repos`);
    endpoint.search = new URLSearchParams({
      type: "owner",
      sort: "updated",
      direction: "desc",
      per_page: "100",
      page: String(page),
    });

    const response = await fetch(endpoint, { headers });
    if (!response.ok) {
      const details = await response.text();
      throw new Error(`GitHub API failed (${response.status}): ${details}`);
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
  const match = categoryDefaults.find((item) => item.match.test(name));
  return match ?? { category: "Other", icon: "bi-github", color: "tint-mint" };
}

function toId(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const filePath = new URL("../data/applications.json", import.meta.url);
const existing = JSON.parse(await readFile(filePath, "utf8"));
if (!Array.isArray(existing)) {
  throw new TypeError("data/applications.json must contain a JSON array.");
}

const byRepository = new Map(
  existing
    .filter((app) => app.repositoryUrl)
    .map((app) => [app.repositoryUrl.replace(/\.git$/, "").toLowerCase(), app]),
);

const seenIds = new Set(existing.map((app) => app.id));
const repositories = await fetchOwnedPublicRepositories();
const additions = [];

for (const repo of repositories) {
  const repositoryUrl = repo.html_url.replace(/\.git$/, "");
  const key = repositoryUrl.toLowerCase();
  const current = byRepository.get(key);

  if (current) {
    // Refresh repository metadata without overwriting curated app links or copy.
    current.repositoryUrl = repositoryUrl;
    current.githubUpdatedAt = repo.updated_at;
    current.defaultBranch = repo.default_branch;
    current.stars = repo.stargazers_count;
    current.fork = repo.fork;
    continue;
  }

  const defaults = defaultsFor(repo.name);
  let id = toId(repo.name) || `repository-${repo.id}`;
  if (seenIds.has(id)) id = `${id}-${repo.id}`;
  seenIds.add(id);

  const homepage = repo.homepage?.trim();
  additions.push({
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
}

const merged = [...existing, ...additions];
await writeFile(filePath, `${JSON.stringify(merged, null, 2)}\n`);

console.log(
  `Synced ${repositories.length} public repositories; added ${additions.length}; dashboard total: ${merged.length}.`,
);
