import { buildSvg } from "./lib.mjs";
import fs from "node:fs/promises";
import path from "node:path";

const GH_TOKEN = process.env.GH_TOKEN;
const GH_USERNAME = process.env.GH_USERNAME;
const OUTPUT_PATH = process.env.OUTPUT_PATH || "dist/swiftbird.svg";
const PALETTE = process.env.PALETTE || "light";

if (!GH_TOKEN || !GH_USERNAME) {
  console.error("GH_TOKEN and GH_USERNAME are required.");
  process.exit(1);
}

const QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays { date contributionCount color }
        }
      }
    }
  }
}`;

async function fetchCalendar(login) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${GH_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
  return json.data.user.contributionsCollection.contributionCalendar.weeks;
}

async function main() {
  const weeks = await fetchCalendar(GH_USERNAME);
  const svg = buildSvg(weeks, PALETTE);
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, svg, "utf8");
  console.log(`Wrote ${OUTPUT_PATH} (${weeks.length} weeks).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
