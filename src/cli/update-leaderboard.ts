import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parse } from "node-html-parser";
import { SingleBar } from "cli-progress";

const MAX_PAGE = 100;
const CRAWL_DELAY_MS = 30_000;
const MAX_RETRIES = 3;

function createProgress(label: string) {
  if (process.stdout.isTTY && !process.env.CI) {
    return new SingleBar({ format: `${label} [{bar}] {percentage}% | {value}/{total}` });
  }
  let total = 0;
  let lastPct = -1;
  return {
    start(t: number, _initial: number) {
      total = t;
      console.log(`${label}: starting (${total} items)`);
    },
    update(value: number) {
      const pct = Math.floor((value / total) * 100);
      if (pct >= lastPct + 10) {
        lastPct = pct;
        console.log(`${label}: ${value}/${total} (${pct}%)`);
      }
    },
    stop() {
      console.log(`${label}: done`);
    },
  };
}

const LEADERBOARD_FILE = path.resolve(__dirname, "..", "data", "leaderboard.json");

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(page: number): Promise<string> {
  const url = `https://www.hasbrorisk.com/en/leaderboard/2/1/rankPoints/${page}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for page ${page}`);
  return res.text();
}

function usersFromHtml(html: string) {
  const root = parse(html);
  const rows = root.querySelectorAll("table > tbody > tr");
  return rows
    .map((element) => {
      const col1 = element.querySelector("td:nth-child(1)");
      const col2 = element.querySelector("td:nth-child(2)");
      const col3 = element.querySelector("td:nth-child(3)");
      try {
        const link = col2?.querySelector("a")?.getAttribute("href") ?? "";
        const url = new URL(link);
        const segments = url.pathname.split("/");
        const id = segments[segments.length - 1];
        if (id === undefined) {
          return null;
        }
        return {
          id,
          position: parseInt((col1?.textContent ?? "0").replace(/\D+/, "")),
          username: col2?.querySelector("a")?.textContent ?? "",
          image: col2?.querySelector("img")?.getAttribute("src") ?? "",
          link,
          points: col3?.textContent ?? "",
        };
      } catch (err) {
        console.error(err);
        return null;
      }
    })
    .filter((user) => user !== null);
}

async function main() {
  const allUsers: ReturnType<typeof usersFromHtml> = [];

  const progress = createProgress("Leaderboard");
  progress.start(MAX_PAGE, 0);

  for (let page = 1; page <= MAX_PAGE; page++) {
    let html: string | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        html = await fetchPage(page);
        break;
      } catch (err) {
        console.error(`Page ${page} attempt ${attempt}/${MAX_RETRIES} failed: ${err}`);
        if (attempt < MAX_RETRIES) {
          await delay(5_000);
        }
      }
    }

    if (html !== null) {
      allUsers.push(...usersFromHtml(html));
    } else {
      console.warn(`Giving up on page ${page} after ${MAX_RETRIES} attempts`);
    }

    progress.update(page);

    if (page < MAX_PAGE) {
      await delay(CRAWL_DELAY_MS);
    }
  }

  progress.stop();
  console.log(`Scraped ${allUsers.length} users from leaderboard`);

  const data = {
    updatedAt: new Date().toISOString(),
    users: allUsers,
  };
  await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(data, null, 2), "utf8");
  console.log("Finished");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
