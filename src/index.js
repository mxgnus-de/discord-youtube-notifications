require('dotenv').config();
const express = require('express');
const YouTubeNotifier = require('youtube-notification');
const { getMyIp, generateSecret, getVideoInformation } = require('./utils');
const { EmbedBuilder, WebhookClient } = require('discord.js');

const PORT = process.env.PORT || 3000;
const baseUrl = (ip) => `http://${ip}:${PORT}`;
const notificationEndpoint = '/youtube-notification';
const channels = [process.env.YOUTUBE_CHANNEL_ID];
const discordWebhookClient = new WebhookClient({
   url: process.env.DISCORD_WEBHOOK_URL,
});
let ytNotifier;

const app = express();

setupYoutubeNotifier().then(() => {
   subscribeChannels(channels);

   ytNotifier.on('subscribe', (data) => {
      console.log('Subscribed to channel ' + data.channel);

      setTimeout(() => {
         subscribe(channels);
      }, data.lease_seconds * 1000);
   });

   ytNotifier.on('notified', (data) => sendVideoNotification(data.video.link));
});

async function setupYoutubeNotifier() {
   const ip = await getMyIp();
   const notifier = new YouTubeNotifier({
      hubCallback: `${baseUrl(ip)}${notificationEndpoint}`,
      secret: generateSecret(),
   });

   app.use(notificationEndpoint, notifier.listener());

   ytNotifier = notifier;
}

function subscribeChannels(channels) {
   console.log('Subscribing to channels:', channels);
   ytNotifier.subscribe(channels);
}

async function sendVideoNotification(videoUrl) {
   const video = await getVideoInformation(videoUrl);
   console.debug('Received video notification:', video.url);

   const embed = new EmbedBuilder()
      .setTitle(`${video.author.name} has uploaded a new video`)
      .setAuthor({
         name: video.author.name,
         url: video.author.url,
      })
      .setURL(video.url)
      .setDescription(video.description)
      .setImage(video.image)
      .setFields([
         {
            name: 'Title',
            value: video.title,
         },
         {
            name: 'Length',
            value: video.duration.timestamp,
         },
         {
            name: 'Video Id',
            value: video.videoId,
         },
         {
            name: 'Url',
            value: video.url,
         },
      ])
      .setColor('#00ff00')
      .setTimestamp();

   discordWebhookClient.send({
      embeds: [embed],
   });
}

app.listen(PORT, () => {
   console.log(`Listening on port ${PORT}`);
});
