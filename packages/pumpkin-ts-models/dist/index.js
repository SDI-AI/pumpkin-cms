"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageJsonConverter = exports.createGenericBlock = exports.isHtmlBlock = exports.isBlockOfType = exports.SUPPORTED_BLOCK_TYPES = exports.BLOCK_TYPE_MAP = exports.userToUserInfo = exports.isUserRole = exports.stringToUserRole = exports.userRoleToString = exports.UserRole = void 0;
var User_1 = require("./models/User");
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return User_1.UserRole; } });
Object.defineProperty(exports, "userRoleToString", { enumerable: true, get: function () { return User_1.userRoleToString; } });
Object.defineProperty(exports, "stringToUserRole", { enumerable: true, get: function () { return User_1.stringToUserRole; } });
Object.defineProperty(exports, "isUserRole", { enumerable: true, get: function () { return User_1.isUserRole; } });
Object.defineProperty(exports, "userToUserInfo", { enumerable: true, get: function () { return User_1.userToUserInfo; } });
var HtmlBlockTypes_1 = require("./models/HtmlBlockTypes");
Object.defineProperty(exports, "BLOCK_TYPE_MAP", { enumerable: true, get: function () { return HtmlBlockTypes_1.BLOCK_TYPE_MAP; } });
Object.defineProperty(exports, "SUPPORTED_BLOCK_TYPES", { enumerable: true, get: function () { return HtmlBlockTypes_1.SUPPORTED_BLOCK_TYPES; } });
Object.defineProperty(exports, "isBlockOfType", { enumerable: true, get: function () { return HtmlBlockTypes_1.isBlockOfType; } });
Object.defineProperty(exports, "isHtmlBlock", { enumerable: true, get: function () { return HtmlBlockTypes_1.isHtmlBlock; } });
Object.defineProperty(exports, "createGenericBlock", { enumerable: true, get: function () { return HtmlBlockTypes_1.createGenericBlock; } });
// JSON converter
var PageJsonConverter_1 = require("./PageJsonConverter");
Object.defineProperty(exports, "PageJsonConverter", { enumerable: true, get: function () { return PageJsonConverter_1.PageJsonConverter; } });
//# sourceMappingURL=index.js.map