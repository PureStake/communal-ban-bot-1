"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
const Discord = __importStar(require("discord.js"));
const MOD_REASON = "Operation by Communal Mod:";
const MESSAGE_COLOR = 0xc2a2e9;
var CommandType;
(function (CommandType) {
    CommandType[CommandType["BAN"] = 0] = "BAN";
    CommandType[CommandType["UNBAN"] = 1] = "UNBAN";
})(CommandType || (CommandType = {}));
class CommunalMod {
    constructor(token, adminId) {
        this.servers = [];
        this.pendingBans = new Map();
        this.client = new Discord.Client();
        this.token = token;
        this.client.on("ready", () => {
            if (process.env.NODE_ENV != "prod") {
                console.log("Running in DEV");
            }
            console.log("Ready to moderate");
        });
        this.client.on("message", (message) => this.onMessage(message));
        this.client.on("guildBanAdd", (guild, user) => this.onGuildBanAdd(guild, user));
    }
    addServer(server) {
        this.servers.push(server);
    }
    login() {
        this.client.login(this.token);
    }
    banUser(guild, id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let reason = "";
            if (options) {
                if (options === null || options === void 0 ? void 0 : options.guild) {
                    reason = `${MOD_REASON} banned from ${options.guild.name}`;
                }
                else if (options === null || options === void 0 ? void 0 : options.message) {
                    reason = `${MOD_REASON} banned by ${options.message.author.username}#${options.message.author.discriminator}`;
                }
            }
            if (process.env.NODE_ENV === "prod") {
                try {
                    guild.members.ban(id, { reason, days: 7 });
                }
                catch (error) {
                    if (options && options.message) {
                        this.sendError(options.message, `Was unable to ban ${id} from ${guild.name} (${guild.id})`);
                    }
                    console.log(error);
                }
            }
            else {
                console.log(`DEV: Banning ${id} on ${guild.name}`);
                console.log(`-> REASON: ${reason}\n`);
            }
        });
    }
    unbanUser(guild, id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let reason = "";
            if (options) {
                if (options === null || options === void 0 ? void 0 : options.guild) {
                    reason = `${MOD_REASON} unbanned from ${options.guild.name}`;
                }
                else if (options === null || options === void 0 ? void 0 : options.message) {
                    reason = `${MOD_REASON} unbanned by ${options.message.author.username}#${options.message.author.discriminator}`;
                }
            }
            if (process.env.NODE_ENV === "prod") {
                try {
                    guild.members.unban(id, reason);
                }
                catch (error) {
                    if (options && options.message) {
                        this.sendError(options.message, `Was unable to ban ${id} from ${guild.name} (${guild.id})`);
                    }
                    console.log(error);
                }
            }
            else {
                console.log(`DEV: Banning ${id} on ${guild.name}`);
                console.log(`-> REASON: ${reason}\n`);
            }
        });
    }
    crossServerBan(ids, options) {
        ids.forEach((id) => {
            this.client.guilds.cache.forEach((guild) => {
                if (options && options.guild && options.guild.id === guild.id) {
                    return;
                }
                this.banUser(guild, id, options);
            });
        });
        if (options && options.message) {
            const response = new Discord.MessageEmbed();
            response.setTitle("**All Bans Processed**");
            response.setColor(MESSAGE_COLOR);
            options.message.reply(response);
        }
    }
    crossServerUnban(ids, options) {
        ids.forEach((id) => {
            this.client.guilds.cache.forEach((guild) => {
                if (options && options.guild && options.guild.id === guild.id) {
                    return;
                }
                this.unbanUser(guild, id, options);
            });
        });
        if (options && options.message) {
            const response = new Discord.MessageEmbed();
            response.setTitle("**All Unbans Processed**");
            response.setColor(MESSAGE_COLOR);
            options.message.reply(response);
        }
    }
    getUserIdsByName(message, guildId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let ids = [];
            let guild;
            try {
                guild = yield this.client.guilds.fetch(guildId);
            }
            catch (error) {
                console.log(error);
                this.sendError(message, `Could not retrieve server with ID: ${guildId}`);
                return ids;
            }
            let user;
            try {
                user = yield this.client.users.fetch(userId);
            }
            catch (error) {
                console.log(error);
                this.sendError(message, `Could not retrieve username of user with ID: ${userId}`);
                return ids;
            }
            try {
                ids = Array.from((yield guild.members.fetch({ query: user.username, limit: 500, force: true })).map((member) => member.id));
                console.log(`IDs: ${ids}`);
            }
            catch (error) {
                console.log(error);
                this.sendError(message, `Could not retrieve users from server with ID: ${guildId}`);
            }
            return ids;
        });
    }
    serverCommand(message) {
        const guildNames = [];
        for (const [_, guild] of this.client.guilds.cache) {
            guildNames.push(guild.name);
        }
        const description = guildNames.map((name) => `- ${name}`).join("\n");
        const response = new Discord.MessageEmbed();
        response.setTitle("Servers");
        response.setDescription(description);
        response.setColor(MESSAGE_COLOR);
        message.reply(response);
    }
    banCommand(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const idPattern = /\d{18}/g;
            const usernamePattern = /--username\s*/g;
            let ids = message.content.match(idPattern);
            if (!ids) {
                this.sendError(message, "One or more IDs required");
                return;
            }
            const users = [];
            if (usernamePattern.test(message.content)) {
                console.log("is username pattern");
                let newIds = [];
                for (const id of ids) {
                    console.log(`ID: ${id}`);
                    for (const server of this.servers) {
                        console.log(`${server}`);
                        newIds = ids.concat(yield this.getUserIdsByName(message, server.serverId, id));
                        console.log(`loop ${ids}`);
                    }
                }
                ids = newIds;
            }
            console.log(ids);
            for (const id of ids) {
                try {
                    const user = yield this.client.users.fetch(id);
                    users.push(user);
                }
                catch (_a) {
                    console.log("error");
                }
            }
            this.pendingBans.set(message.author.id, {
                ids,
                commandType: CommandType.BAN,
            });
            const description = users.map((user) => user.toString()).join(" ");
            const response = new Discord.MessageEmbed();
            response.setTitle("**You will ban these users:**");
            response.setDescription(description);
            response.setFooter("Types [y]es to confirm or anything else to cancel");
            response.setColor(MESSAGE_COLOR);
            message.reply(response);
        });
    }
    unbanCommand(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const idPattern = /\d{18}/g;
            const ids = message.content.match(idPattern);
            if (!ids) {
                this.sendError(message, "One or more IDs required");
                return;
            }
            const users = [];
            for (const id of ids) {
                try {
                    const user = yield this.client.users.fetch(id);
                    users.push(user);
                }
                catch (_a) {
                    console.log("error");
                }
            }
            this.pendingBans.set(message.author.id, {
                ids,
                commandType: CommandType.UNBAN,
            });
            const description = users.map((user) => user.toString()).join(" ");
            const response = new Discord.MessageEmbed();
            response.setTitle("**You will unban these users:**");
            response.setDescription(description);
            response.setFooter("Types [y]es to confirm or anything else to cancel");
            response.setColor(MESSAGE_COLOR);
            message.reply(response);
        });
    }
    sendError(message, error) {
        const response = new Discord.MessageEmbed();
        response.setTitle("**Error**");
        response.setDescription(error);
        response.setColor(0xff0000);
        message.reply(response);
    }
    isWhitelisted(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const botGuilds = Array.from(this.client.guilds.cache);
            for (let [id, guild] of botGuilds) {
                for (let serverSettings of this.servers) {
                    if (serverSettings.serverId === id && serverSettings.whitelisted) {
                        const member = yield guild.members.fetch(userId);
                        if (member &&
                            member.hasPermission(Discord.Permissions.FLAGS.BAN_MEMBERS)) {
                            return true;
                        }
                    }
                }
            }
            console.log("returning false");
            return false;
        });
    }
    onMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (message.channel.type != "dm")
                return;
            if (message.author.id === this.client.user.id)
                return;
            if (!(yield this.isWhitelisted(message.author.id))) {
                this.sendError(message, "You are not permitted to use this bot.\nThe admin has been notified");
                return;
            }
            const msgContent = message.content.toLowerCase();
            const pendingBans = this.pendingBans.get(message.author.id);
            if (pendingBans) {
                if (/\s*(yes|y)\s*/g.test(msgContent)) {
                    const { ids, commandType } = pendingBans;
                    if (commandType == CommandType.BAN) {
                        this.crossServerBan(ids, { message });
                    }
                    else if (commandType == CommandType.UNBAN) {
                        this.crossServerUnban(ids, { message });
                    }
                }
                else {
                    const response = new Discord.MessageEmbed();
                    response.setTitle("**Canceling Command**");
                    response.setColor(MESSAGE_COLOR);
                    message.reply(response);
                }
                this.pendingBans.delete(message.author.id);
                return;
            }
            const banCommandPattern = /\s*!ban (--username\s+)?(\d{18}\s*)+/g;
            const serverCommandPattern = /\s*!servers\s*/g;
            const unbanCommandPattern = /\s*!unban (\d{18}\s*)+/g;
            if (banCommandPattern.test(msgContent)) {
                this.banCommand(message);
            }
            else if (unbanCommandPattern.test(msgContent)) {
                this.unbanCommand(message);
            }
            else if (serverCommandPattern.test(msgContent)) {
                this.serverCommand(message);
            }
        });
    }
    onGuildBanAdd(guild, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = this.servers.find((server) => server.serverId === guild.id && server.whitelisted);
            if (server == undefined) {
                return;
            }
            const ban = yield guild.fetchBan(user.id);
            if (!ban || (ban.reason && ban.reason.startsWith(MOD_REASON))) {
                return;
            }
            this.crossServerBan([user.id], { guild });
        });
    }
}
exports.default = CommunalMod;
