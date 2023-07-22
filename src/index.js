"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("node:fs/promises");
var path = require("node:path");
var node_html_parser_1 = require("node-html-parser");
var cli_progress_1 = require("cli-progress");
var MAX_PAGE = 100;
var PAGINATION_DELAY = 3000;
var LEADERBOARD_FILE = path.resolve(__dirname, "..", "data", "leaderboard.json");
function htmlFromUrl(url) {
    return __awaiter(this, void 0, void 0, function () {
        var res, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fetch(url)];
                case 1:
                    res = _b.sent();
                    if (!res.ok) return [3 /*break*/, 3];
                    _a = node_html_parser_1.parse;
                    return [4 /*yield*/, res.text()];
                case 2: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
                case 3: return [2 /*return*/, null];
            }
        });
    });
}
function usersFromHtml(html) {
    var rows = html.querySelectorAll("table > tbody > tr");
    return rows.map(function (element) {
        var _a, _b, _c, _d, _e, _f, _g;
        var col1 = element.querySelector("td:nth-child(1)");
        var col2 = element.querySelector("td:nth-child(2)");
        var col3 = element.querySelector("td:nth-child(3)");
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
    return __awaiter(this, void 0, void 0, function () {
        var existingUsers, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, fs.readFile(LEADERBOARD_FILE, "utf8")];
                case 1:
                    existingUsers = _b.apply(_a, [_c.sent()]);
                    return [4 /*yield*/, fs.writeFile(LEADERBOARD_FILE, JSON.stringify(__spreadArray(__spreadArray([], existingUsers, true), users, true), null, 2), "utf8")];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var progress = new cli_progress_1.SingleBar({});
progress.start(MAX_PAGE, 0);
function main(page) {
    if (page === void 0) { page = 1; }
    return __awaiter(this, void 0, void 0, function () {
        var html, users;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(page === 1)) return [3 /*break*/, 2];
                    return [4 /*yield*/, fs.writeFile(LEADERBOARD_FILE, JSON.stringify([]), "utf8")];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    if (page > MAX_PAGE) {
                        progress.stop();
                        console.log("Finished");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, htmlFromUrl("https://www.hasbrorisk.com/en/leaderboard/2/1/rankPoints/".concat(page))];
                case 3:
                    html = _a.sent();
                    if (!(html !== null)) return [3 /*break*/, 5];
                    users = usersFromHtml(html);
                    return [4 /*yield*/, saveLeaderboard(users)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    progress.update(page);
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, PAGINATION_DELAY); })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, main(page + 1)];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .then(function () {
    process.exit(0);
})
    .catch(function (err) {
    console.error(err);
    process.exit(1);
});
