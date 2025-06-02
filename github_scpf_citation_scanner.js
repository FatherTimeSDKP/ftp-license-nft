require('dotenv').config();
const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error("Error: Set GITHUB_TOKEN in your .env file.");
  process.exit(1);
}

const headers = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json'
};

// Your principles and author info for keywords
const PRINCIPLES = [
  "SDKP",
  "QCC",
  "EOS",
  "SD&N",
  "Donald Paul Smith",
  "FatherTime",
  "fathertimesdkp.blockchain"
];

// Helper: build GitHub search query with keywords for repo
function buildSearchQuery(keywords, repo) {
  // Search in file contents, repo limited
  const queryParts = keywords.map(k => `${k} in:file repo:${repo}`);
  return queryParts.join(' ');
}

// Fetch matching files from GitHub Search API
async function searchCodeOnGitHub(repo, keywords) {
  const query = buildSearchQuery(keywords, repo);
  console.log(`[~] Searching repo ${repo} for keywords: ${keywords.join(", ")}`);

  try {
    const response = await axios.get(`https://api.github.com/search/code?q=${encodeURIComponent(query)}`, {
      headers,
      params: { per_page: 20 } // Limit results per page
    });
    return response.data.items || [];
  } catch (error) {
    console.error("[!] GitHub API error:", error.response?.data?.message || error.message);
    return [];
  }
}

// Check if file content cites your manifest or author
async function checkFileCitation(fileItem) {
  try {
    // fileItem.url is API URL for content; convert to raw URL
    const rawUrl = fileItem.url.replace('api.github.com/repos', 'raw.githubusercontent.com').replace('/contents/', '/');
    const resp = await axios.get(rawUrl);
    const content = resp.data.toLowerCase();

    // Simple heuristics to check for your citations
    const cited = content.includes('donald paul smith') ||
                  content.includes('fathertimesdkp.blockchain') ||
                  content.includes('father time') ||
                  content.includes('sdkp') && content.includes('license');

    if (!cited) {
      console.log(`[!] Uncited usage detected: ${fileItem.html_url}`);
    } else {
      console.log(`[✓] Proper citation found in: ${fileItem.html_url}`);
    }
  } catch (err) {
    console.error(`[!] Error fetching file ${fileItem.html_url}: ${err.message}`);
  }
}

async function main() {
  // Example repo to scan
  const repo = "someuser/somerepo"; // Replace with the repo you want to check

  const foundFiles = await searchCodeOnGitHub(repo, PRINCIPLES);
  if (foundFiles.length === 0) {
    console.log("[✓] No matching files found for keywords.");
    return;
  }

  for (const file of foundFiles) {
    await checkFileCitation(file);
  }
}

main();
