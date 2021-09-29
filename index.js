#!/usr/bin/env node

const createPairs = (weeks=4) => {
    if (weeks % 4 != 0) {
        throw new Error("Weeks can't be divided into months");
    }

    const users = ['Samy', 'Mund', 'Alexandra', 'Martin', 'Joël'];
    const pairs = [];

    for (let i = 0, l = users.length; i < 2 * weeks;) {
        pairs.push([users[i % l], users[(i + 1) % l]])

        // 5 weeks are over, shuffle users for new pairings
        if (i % l == 0 && i > 0) {
            for (let i = users.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [users[i], users[j]] = [users[j], users[i]];
            }
        }

        i += 2;
    }

    return pairs;
}

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
            json.pairs = createPairs(52);
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