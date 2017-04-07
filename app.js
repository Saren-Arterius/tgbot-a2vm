#!/usr/bin/env node
const TelegramBot = require('node-telegram-bot-api');
const exec = require('child_process').exec;
const request = require('request');
const fs = require('fs');

const DOWNLOAD_LINK = 'https://api.telegram.org/file/bot';
const token = process.env.TOKEN;
const bot = new TelegramBot(token, {
  polling: true
});

bot.on('message', (msg) => {
  if (!msg.audio) {
    return;
  }
  console.log(msg);
  bot.getFile(msg.audio.file_id).then((info) => {
    var tmpFilePath = '/tmp/' + info.file_id + '.mp3';
    console.log('Writing to', tmpFilePath);
    request(DOWNLOAD_LINK + token + '/' + info.file_path)
      .pipe(fs.createWriteStream(tmpFilePath))
      .on('finish', () => {
        console.log('Starting ffmpeg', tmpFilePath);
        exec(`ffmpeg -i ${tmpFilePath} -b:a 64k ${tmpFilePath}.ogg`, (error, stdout, stderr) => {
          if (error) return console.error(error);
          var stream = fs.createReadStream(tmpFilePath + '.ogg');
          console.log('Sending voice', tmpFilePath);
          bot.sendVoice(msg.chat.id, stream).then((resp) => {
            console.log('Done', resp);
          });
        });
      });
  });
});
