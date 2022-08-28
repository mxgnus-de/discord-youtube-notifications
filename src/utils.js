const yts = require('yt-search');
const axios = require('axios');

function getMyIp() {
   return new Promise((resolve, reject) => {
      axios
         .get('https://api.ipify.org?format=json')
         .then((res) => {
            resolve(res.data.ip);
         })
         .catch((err) => {
            reject(err);
         });
   });
}

function generateSecret() {
   return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
   );
}

async function getVideoInformation(url) {
   const result = await yts(url);
   const video = result.videos[0];
   return video;
}

module.exports = {
   getMyIp,
   generateSecret,
   getVideoInformation,
};
