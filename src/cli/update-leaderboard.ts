import "dotenv/config";
import * as fs from "node:fs/promises";
import * as https from "node:https";
import * as path from "node:path";
import { parse, type HTMLElement } from "node-html-parser";
import { SingleBar } from "cli-progress";
import { SocksProxyAgent } from "socks-proxy-agent";

const MAX_PAGE = 100;
const LEADERBOARD_FILE = path.resolve(__dirname, "..", "data", "leaderboard.json");

const NORDVPN_API = "https://api.nordvpn.com/v1/servers";
const SOCKS5_TECH_ID = 7;

async function getSocks5ProxyHosts(): Promise<string[]> {
  const url = new URL(NORDVPN_API);
  url.searchParams.set("limit", "10000");
  url.searchParams.set("filters[servers_technologies][id]", String(SOCKS5_TECH_ID));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`NordVPN API error: ${res.status}`);

  const servers: { hostname: string; load: number }[] = await res.json();
  servers.sort((a, b) => a.load - b.load);
  return servers.map((s) => s.hostname);
}

function makeAgent(host: string) {
  const url = `socks5://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${host}:${process.env.PROXY_PORT}`;
  return new SocksProxyAgent(url);
}

let allAgents: SocksProxyAgent[] = [];

// Hard timeout that covers the entire request lifecycle including SOCKS handshake
function withHardTimeout<T>(promise: Promise<T>, ms: number, cleanup?: () => void): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup?.();
        reject(new Error("Hard timeout"));
      }
    }, ms);
    promise.then(
      (val) => { if (!settled) { settled = true; clearTimeout(timer); resolve(val); } },
      (err) => { if (!settled) { settled = true; clearTimeout(timer); reject(err); } },
    );
  });
}

function rawGet(url: string, proxyAgent: SocksProxyAgent, timeout: number): Promise<{ status: number; body: string }> {
  let reqRef: ReturnType<typeof https.get> | undefined;
  const inner = new Promise<{ status: number; body: string }>((resolve, reject) => {
    const req = https.get(url, { agent: proxyAgent, timeout }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString() }));
    });
    reqRef = req;
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout: ${url}`));
    });
  });
  return withHardTimeout(inner, timeout + 5000, () => reqRef?.destroy());
}

// Single pass through all proxies starting at startAgent — returns null if every proxy fails
async function tryFetch(url: string, startAgent: number, timeout = 30000): Promise<HTMLElement | null> {
  let idx = startAgent;
  for (let i = 0; i < allAgents.length; i++) {
    try {
      const { status, body } = await rawGet(url, allAgents[idx], timeout);
      if (status === 200) {
        return parse(body);
      }
    } catch {
      // network/timeout error — try next proxy
    }
    idx = (idx + 1) % allAgents.length;
  }
  return null;
}

// Stream-based online check: resolves as soon as the target string is found in any chunk, then aborts the request
function rawGetEarlyAbort(
  url: string,
  proxyAgent: SocksProxyAgent,
  target: string,
  timeout: number,
): Promise<{ status: number; found: boolean }> {
  let reqRef: ReturnType<typeof https.get> | undefined;
  const inner = new Promise<{ status: number; found: boolean }>((resolve, reject) => {
    const req = https.get(url, { agent: proxyAgent, timeout }, (res) => {
      if (res.statusCode !== 200) {
        res.destroy();
        resolve({ status: res.statusCode ?? 0, found: false });
        return;
      }
      let carry = "";
      res.on("data", (chunk: Buffer) => {
        // Prepend leftover from previous chunk to handle target split across chunks
        const str = carry + chunk.toString();
        if (str.includes(target)) {
          res.destroy();
          req.destroy();
          resolve({ status: 200, found: true });
          return;
        }
        // Keep the last (target.length - 1) chars in case the target spans two chunks
        carry = str.length >= target.length ? str.slice(-(target.length - 1)) : str;
      });
      res.on("end", () => resolve({ status: 200, found: false }));
    });
    reqRef = req;
    req.on("error", (err) => {
      // If we already resolved via early abort, ignore the error from destroy()
      if ((err as NodeJS.ErrnoException).code === "ERR_STREAM_PREMATURE_CLOSE") return;
      reject(err);
    });
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout: ${url}`));
    });
  });
  return withHardTimeout(inner, timeout + 5000, () => reqRef?.destroy());
}

// Per-worker proxy state for online checks — each worker independently manages its own proxy
class WorkerProxy {
  private idx: number;
  constructor(startIndex: number) {
    this.idx = startIndex;
  }
  get agent() {
    return allAgents[this.idx];
  }
  rotate() {
    this.idx = (this.idx + 1) % allAgents.length;
  }
  // Returns whether the target string was found — aborts early on match
  async fetchOnline(url: string, target: string, timeout = 5000): Promise<boolean | null> {
    const maxAttempts = Math.min(allAgents.length, 20);
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const { status, found } = await rawGetEarlyAbort(url, this.agent, target, timeout);
        if (status === 200) {
          return found;
        }
        this.rotate();
      } catch {
        this.rotate();
      }
    }
    return null;
  }
}

function usersFromHtml(html: HTMLElement) {
  const rows = html.querySelectorAll("table > tbody > tr");
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
          online: false,
        };
      } catch (err) {
        console.error(err);
        return null;
      }
    })
    .filter((user) => {
      return user !== null;
    });
}

type ScrapedUser = ReturnType<typeof usersFromHtml>[number];

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, workerIndex: number) => Promise<void>,
) {
  let index = 0;
  async function worker(workerIndex: number) {
    while (index < items.length) {
      const i = index++;
      await fn(items[i], workerIndex);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, (_, i) => worker(i)));
}

async function main() {
  const proxyHosts = await getSocks5ProxyHosts();
  console.log(`Fetched ${proxyHosts.length} SOCKS5 proxy servers`);
  allAgents = proxyHosts.map(makeAgent);

  const allUsers: ScrapedUser[] = [];

  // Phase 1: Scrape leaderboard pages with deferred retries
  const MAX_RETRY_PASSES = 4;
  const pageResults: { page: number; users: ScrapedUser[] }[] = [];
  let pending = Array.from({ length: MAX_PAGE }, (_, i) => i + 1);

  for (let pass = 0; pass <= MAX_RETRY_PASSES; pass++) {
    if (pass > 0) {
      const backoff = Math.min(pass * 3000, 10000);
      console.log(`Retry pass ${pass}/${MAX_RETRY_PASSES}: ${pending.length} pages remaining (waiting ${backoff / 1000}s)`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }

    const progress = new SingleBar({
      format: `Leaderboard${pass > 0 ? ` retry ${pass}` : ""} [{bar}] {percentage}% | {value}/{total}`,
    });
    progress.start(pending.length, 0);

    const failed: number[] = [];
    let checked = 0;

    await runWithConcurrency(pending, allAgents.length, async (page, workerIndex) => {
      const html = await tryFetch(
        `https://www.hasbrorisk.com/en/leaderboard/2/1/rankPoints/${page}`,
        workerIndex % allAgents.length,
      );
      if (html !== null) {
        const users = usersFromHtml(html);
        pageResults.push({ page, users });
      } else {
        failed.push(page);
      }
      progress.update(++checked);
    });

    progress.stop();
    pending = failed;

    if (pending.length === 0) break;
  }

  if (pending.length > 0) {
    console.warn(`Giving up on ${pending.length} pages after ${MAX_RETRY_PASSES} retries: ${pending.join(", ")}`);
  }

  pageResults.sort((a, b) => a.page - b.page);
  for (const result of pageResults) {
    allUsers.push(...result.users);
  }

  console.log(`Scraped ${allUsers.length} users from leaderboard`);

  // Phase 2: Check online status — fan out across ALL proxies simultaneously
  const onlineConcurrency = allAgents.length * 10;
  console.log(`Checking online status for all ${allUsers.length} players across ${allAgents.length} proxies (concurrency: ${onlineConcurrency})`);

  const onlineProgress = new SingleBar({ format: "Online check [{bar}] {percentage}% | {value}/{total}" });
  let checked = 0;
  let onlineCount = 0;
  onlineProgress.start(allUsers.length, 0);

  // Each worker gets its own proxy state — rotates independently on rate limit
  const workerProxies: WorkerProxy[] = [];
  for (let i = 0; i < onlineConcurrency; i++) {
    workerProxies.push(new WorkerProxy(i % allAgents.length));
  }

  await runWithConcurrency(allUsers, onlineConcurrency, async (user, workerIndex) => {
    const proxy = workerProxies[workerIndex];
    const found = await proxy.fetchOnline(`https://www.hasbrorisk.com/en/player/${user.id}`, "Currently Online: Yes");
    if (found !== null) {
      user.online = found;
      if (user.online) onlineCount++;
    }
    onlineProgress.update(++checked);
  });

  onlineProgress.stop();

  console.log(`${onlineCount} users currently online (out of ${allUsers.length} checked)`);

  // Write final JSON envelope
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
