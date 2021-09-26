#!/usr/bin/env node

const createPairs = (weeks=4) => {
    if (weeks % 4 != 0) {
        throw new Error("Weeks can't be divided into months");
    }

    const users = ['Samy', 'Alexandra', 'Martin', 'Joël'];
    const pairs = [];

    for (let i = 0, l = users.length; i < 2 * weeks; i += 2) {
        pairs.push([users[i % l], users[(i + 1) % l]])

        // 5 weeks are over, shuffle users for new pairings
        if (i % l == 0 && i > 0) {
            for (let i = users.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [users[i], users[j]] = [users[j], users[i]];
            }
        }
    }

    return pairs;
}

process.env.NTBA_FIX_319 = 1;

console.log("I'm running");

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const chatId = -262964044;

// replace the value below with the Telegram token you receive from @BotFather
const token = '2047447406:AAF5jn2uNxPR7kDbAWLWlGLQTh4tXKWUAZM';

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
        const pairs = [];

        while (pairs.length < 4 && json.pairs.length > 0) {
            pairs.push(json.pairs.pop());
        }

        // Out of pairs
        if (json.pairs.length == 0) {
            json.pairs = createPairs(weeks=52);
        }
        
        bot.sendMessage(chatId, [
            'Hey everyone, this is the cleaning 🧽 schedule for the coming 4 weeks:',
            "",
            `Week 1: ${pairs[0][0]} and ${pairs[0][1]}`,
            `Week 2: ${pairs[1][0]} and ${pairs[1][1]}`,
            `Week 3: ${pairs[2][0]} and ${pairs[2][1]}`,
            `Week 4: ${pairs[3][0]} and ${pairs[3][1]}`
        ].join("\n"));

        json.last_read = now;
        
        fs.writeFile('./cache.json', JSON.stringify(json), () => {});
    }
// })();
}, 1000 * 60 * 60); // Every 1 hrs
