"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const node_html_parser_1 = require("node-html-parser");
const cli_progress_1 = require("cli-progress");
const MAX_PAGE = 100;
const PAGINATION_DELAY = 1000;
const LEADERBOARD_FILE = path.resolve(__dirname, "..", "data", "leaderboard.json");
function htmlFromUrl(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(url);
        if (res.ok) {
            return (0, node_html_parser_1.parse)(yield res.text());
        }
        return null;
    });
}
function usersFromHtml(html) {
    const rows = html.querySelectorAll("table > tbody > tr");
    return rows.map((element) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const col1 = element.querySelector("td:nth-child(1)");
        const col2 = element.querySelector("td:nth-child(2)");
        const col3 = element.querySelector("td:nth-child(3)");
        return {
            position: parseInt(((_a = col1 === null || col1 === void 0 ? void 0 : col1.textContent) !== null && _a !== void 0 ? _a : "0").replace(/\D+/, "")),
            username: (_c = (_b = col2 === null || col2 === void 0 ? void 0 : col2.querySelector("a")) === null || _b === void 0 ? void 0 : _b.textContent) !== null && _c !== void 0 ? _c : "",
            image: (_e = (_d = col2 === null || col2 === void 0 ? void 0 : col2.querySelector("img")) === null || _d === void 0 ? void 0 : _d.getAttribute("src")) !== null && _e !== void 0 ? _e : "",
            link: (_g = (_f = col2 === null || col2 === void 0 ? void 0 : col2.querySelector("a")) === null || _f === void 0 ? void 0 : _f.getAttribute("href")) !== null && _g !== void 0 ? _g : "",
            points: col3 === null || col3 === void 0 ? void 0 : col3.textContent,
        };
    });
}
function saveLeaderboard(users) {
    return __awaiter(this, void 0, void 0, function* () {
        const existingUsers = JSON.parse(yield fs.readFile(LEADERBOARD_FILE, "utf8"));
        yield fs.writeFile(LEADERBOARD_FILE, JSON.stringify([...existingUsers, ...users], null, 2), "utf8");
    });
}
const progress = new cli_progress_1.SingleBar({});
progress.start(MAX_PAGE, 0);
function main(page = 1) {
    return __awaiter(this, void 0, void 0, function* () {
        if (page === 1) {
            yield fs.writeFile(LEADERBOARD_FILE, JSON.stringify([]), "utf8");
        }
        if (page > MAX_PAGE) {
            progress.stop();
            console.log("Finished");
            return;
        }
        const html = yield htmlFromUrl(`https://www.hasbrorisk.com/en/leaderboard/2/1/rankPoints/${page}`);
        if (html !== null) {
            const users = usersFromHtml(html);
            yield saveLeaderboard(users);
        }
        progress.update(page);
        yield new Promise((resolve) => setTimeout(resolve, PAGINATION_DELAY));
        yield main(page + 1);
    });
}
main()
    .then(() => {
    process.exit(0);
})
    .catch((err) => {
    console.error(err);
    process.exit(1);
});
