#!/usr/bin/env node

const createTeams = (weeks=4) => {
    if (weeks % 4 != 0 || weeks <= 0) {
        throw new Error("Weeks can't be divided into months");
    }

    const names = ['Samy', 'Mund', 'Alexandra', 'Martin', 'Joël'];;
    const people = Object.fromEntries(names.map(name => [name, []]));

    for (let i = 0, n = names.length; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (names[i] == 'Samy' && names[j] == 'Alexandra') continue;

            if (!people[names[i]].includes(names[j])) people[names[i]].push(names[j]);
            if (!people[names[j]].includes(names[i])) people[names[j]].push(names[i]);
        }
    }

    const teams = [];
    const bins = Object.fromEntries(names.map(name => [name, 0]));

    while (teams.length < weeks) {
        const name = Object.keys(bins).reduce((k, v) => bins[v] > bins[k] ? v : k);
        const partner = people[name].reduce((c, n) => bins[n] > bins[c] ? n : c);

        bins[name] -= 1;
        bins[partner] -= 1;

        teams.push([name, partner]);
    }

    return teams;
};

// TODO: non-random scheduling that makes someone clean roughly every other week
const createSchedule = (teams) => {
    for (let i = teams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [teams[i], teams[j]] = [teams[j], teams[i]];
    }

    return teams;
};

process.env.NTBA_FIX_319 = 1;

console.log("I'm running");

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const botUsername = 'rxl1318_bot';
const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf8'));
const chatId = settings.debugging ? -545271020 : -262964044;

// replace the value below with the Telegram token you receive from @BotFather
const token = settings.bot_token;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {
    polling: true
});

setInterval(async () => {
// (async () => {
    const now = Date.now(); // Unix timestamp in milliseconds

    const json = await new Promise(r => {
        fs.readFile('./cache.json', 'utf8', (err, data) => r(JSON.parse(data)));
    });

    // Longer than a month ago
    if (now - json.last_read > 1000 * 60 * 60 * 24 * 7 * 4) {
        // Out of pairs
        if (json.pairs.length <= 4) {
            json.pairs = createSchedule(createTeams(52));
        }
        
        const pairs = [];

        while (pairs.length < 4 && json.pairs.length > 0) {
            pairs.push(json.pairs.pop());
        }

        const today = new Date();
        const week = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const weeks = [];
        
        for (let i = 0; i < 4; i++) {
            // https://stackoverflow.com/a/13190874
            const monday = new Date(week.setDate(week.getDate() - week.getDay() + 1));
            const sunday = new Date(week.setDate(week.getDate() - week.getDay() + 7));

            const startDay = String(monday.getUTCDate()).padStart(2, '0');
            const endDay = String(sunday.getUTCDate()).padStart(2, '0');
            const startMonth = String(monday.getUTCMonth() + 1).padStart(2, '0');
            const endMonth = String(sunday.getUTCMonth() + 1).padStart(2, '0');

            weeks.push([startDay, startMonth, endDay, endMonth]);
        }

        const message = [
            "Hey everyone, this is the cleaning 🧽 schedule for the coming 4 weeks:\n",
        ];

        for (let i = 0; i < 4; i++) {
            message.push(
                `${weeks[i][0]}/${weeks[i][1]} to ${weeks[i][2]}/${weeks[i][3]}: ${pairs[i][0]} and ${pairs[i][1]}`,
            );
        }

        bot.sendMessage(chatId, message.join("\n")).then(r => bot.pinChatMessage(r.chat.id, r.message_id));

        json.last_read = now;
        
        fs.writeFile('./cache.json', JSON.stringify(json), () => {});
    }
// })();

}, 1000 * 60 * 60); // Every 1 hrs