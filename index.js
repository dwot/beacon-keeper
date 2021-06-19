const Discord = require('discord.js');
const client = new Discord.Client();
const secrets = require('./secrets');
const csv = require('csv-parse');
const fs = require('fs');
let lastMsgProcessed = '0';

require('dotenv').config();
client.login(secrets.read('BKPR_DISCO_KEY') || process.env.BKPR_DISCO_KEY);

client.once('ready', async () => {
    console.log('Ready!');
    const defaultNumber = (secrets.read('TWILIO_DEFAULT_NUMBER') || process.env.TWILIO_DEFAULT_NUMBER);
    const adminIds = (secrets.read('ADMIN_USERS') || process.env.ADMIN_USERS);
    var adminArr = adminIds.split(',');
    client.on('message', message => {
        console.log(`MSG(${message.createdAt}): (${message.guild.name}) ${message.author.username}: ${message.content}`);
        if (lastMsgProcessed == message.id) return;
        lastMsgProcessed = message.id;
        const prefix = (secrets.read('BKPR_BOT_TRIGGER') || process.env.BKPR_BOT_TRIGGER || '!bkpr');
        if (!message.content.startsWith(prefix)) return;
        if (adminArr.includes(message.author.id)) {
            let args = message.content.slice(prefix.length).trim().split(' ');
            let command = args.shift().toLowerCase();
            if (command == 'test') {
                message.channel.send(' Sending Test Call to Admin ');
                sendCall(defaultNumber, 'admin');
                console.log(' Test Processed! ');
            } else if (command == 'ttxt') {
                message.channel.send(' Sending Test Alert to Admin ');
                sendText(defaultNumber, 'admin');
                console.log(' Test Processed! ');
            } else if (command == 'alert') {
                message.channel.send(' Sending Alerts!');
                processList(message);
                message.channel.send(' Alerts Sent!');
                console.log(' REAL Processed! ');
            } else if (command == 'list') {
                message.channel.send(' Building List Report ');
                listReport(message);
                console.log(' DONE List Report ');
            } else {
                message.channel.send(' Unknown Command, ignoring. ');
                console.log(' null Processed! ');
            }
        } else {
            console.log(' Not Authorized ');
        }
    });
});

function listReport(message) {
    var reportMap = new Map();
    var totalCount = 0;
    fs.createReadStream('list.csv')
        .pipe(csv())
        .on('data', (row) => {
            //console.log(row);
            let name = row[0];
            let guild = row[1];
            let type = row[2];
            let number = row[3];
            console.log(`PROCESS ENTRY: ${name} (${guild})`);
            if (reportMap.has(guild)) {
                var count = reportMap.get(guild);
                count = count+1;
                reportMap.set(guild,count);
            } else {
                reportMap.set(guild,1);
            }
            totalCount = totalCount + 1;
        })
        .on('end', () => {
            console.log('CSV file successfully processed');
            var report = `Call List Report: \n \t Total Entries: ${totalCount}`;
            for (let [key, value] of reportMap) {
                report += `\n \t ${key}: ${value} `;
            }
            console.log(report);
            message.channel.send(report);
        });
}

function processList() {
    console.log('Start Process Iteration');
    fs.createReadStream('list.csv')
        .pipe(csv())
        .on('data', (row) => {
            //console.log(row);
            let name = row[0];
            let guild = row[1];
            let type = row[2];
            let number = row[3];
            console.log(`PROCESS ENTRY: ${name} (${guild})`);
            if (type == 'T') {
                console.log(`Sending Text for: ${name}.`);
                sendText(number, name);
            } else if (type == 'C') {
                console.log(`Sending Call for: ${name}.`);
                sendCall(number, name);
            } else if (type == 'B') {
                console.log(`Sending Both for: ${name}.`);
                sendText(number, name);
                sendCall(number, name);
            } else {
                console.log(`Unknown Type specified for : ${name}. No action taken`);
            }
        })
        .on('end', () => {
            console.log('CSV file successfully processed');
        });
    console.log('End Process Iteration');
}

function sendText(toNumber, name) {
    let accountSid = (secrets.read('TWILIO_ACCT_SID') || process.env.TWILIO_ACCT_SID);
    let authToken = (secrets.read('TWILIO_AUTH_TKN') || process.env.TWILIO_AUTH_TKN);
    let fromNumber = (secrets.read('TWILIO_PHONE_NUM') || process.env.TWILIO_PHONE_NUM);
    let alertTxt = (secrets.read('ALERT_TXT_MSG') || process.env.ALERT_TXT_MSG);

    let twilio = require('twilio');
    let client = new twilio(accountSid, authToken);
    console.log(`Texting: ${toNumber}`);
    client.messages.create({
        body: name + ': ' + alertTxt,
        to: toNumber,  // Text this number
        from: fromNumber // From a valid Twilio number
    })
        .then((msg) => console.log(`TXTID:${msg}`));
    console.log('Texted!');
}

function sendCall(toNumber, name) {
    let accountSid = (secrets.read('TWILIO_ACCT_SID') || process.env.TWILIO_ACCT_SID);
    let authToken = (secrets.read('TWILIO_AUTH_TKN') || process.env.TWILIO_AUTH_TKN);
    let fromNumber = (secrets.read('TWILIO_PHONE_NUM') || process.env.TWILIO_PHONE_NUM);
    let alertTxt = (secrets.read('ALERT_VOICE_MSG') || process.env.ALERT_VOICE_MSG);

    let twilio = require('twilio');
    let client = new twilio(accountSid, authToken);
    console.log(`Calling: ${toNumber}`);
    client.calls
        .create({
            twiml: `<Response><Say>${name}! ${alertTxt}</Say></Response>`,
            to: toNumber,
            from: fromNumber
        })
        .then(call => console.log(`CALLID:${call}`));
    console.log('Called!');
}
