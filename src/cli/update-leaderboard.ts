import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parse, type HTMLElement } from "node-html-parser";
import { SingleBar } from "cli-progress";

const MAX_PAGE = 100;
const PAGINATION_DELAY = 1500;
const LEADERBOARD_FILE = path.resolve(__dirname, "..", "data", "leaderboard.json");

async function htmlFromUrl(url: string) {
  const res = await fetch(url);
  if (res.ok) {
    return parse(await res.text());
  }
  return null;
}

function usersFromHtml(html: HTMLElement) {
  const rows = html.querySelectorAll("table > tbody > tr");
  return rows.map((element) => {
    const col1 = element.querySelector("td:nth-child(1)");
    const col2 = element.querySelector("td:nth-child(2)");
    const col3 = element.querySelector("td:nth-child(3)");
    return {
      position: parseInt((col1?.textContent ?? "0").replace(/\D+/, "")),
      username: col2?.querySelector("a")?.textContent ?? "",
      image: col2?.querySelector("img")?.getAttribute("src") ?? "",
      link: col2?.querySelector("a")?.getAttribute("href") ?? "",
      points: col3?.textContent,
    };
  });
}

async function saveLeaderboard(users: ReturnType<typeof usersFromHtml>) {
  const existingUsers = JSON.parse(await fs.readFile(LEADERBOARD_FILE, "utf8"));
  await fs.writeFile(LEADERBOARD_FILE, JSON.stringify([...existingUsers, ...users], null, 2), "utf8");
}

const progress = new SingleBar({});

progress.start(MAX_PAGE, 0);

async function main(page = 1) {
  if (page === 1) {
    await fs.writeFile(LEADERBOARD_FILE, JSON.stringify([]), "utf8");
  }
  if (page > MAX_PAGE) {
    progress.stop();
    console.log("Finished");
    return;
  }
  const html = await htmlFromUrl(`https://www.hasbrorisk.com/en/leaderboard/2/1/rankPoints/${page}`);
  if (html !== null) {
    const users = usersFromHtml(html);
    await saveLeaderboard(users);
  }
  progress.update(page);
  await new Promise((resolve) => setTimeout(resolve, PAGINATION_DELAY));
  await main(page + 1);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
