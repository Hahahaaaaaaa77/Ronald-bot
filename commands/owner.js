const axios = require("axios");
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone'); 

module.exports = {
  name: 'owner',
  description: 'Get owner information and a video',
  author: 'Jayy',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    try {
      const ownerInfo = {
        name: 'RONALD SORY ホ',
        gender: 'Male',
        age: '17 Years old',
        height: 'Null',
        facebookLink: 'https://www.facebook.com/SORY.RONALD',
        nick: 'SHIKA'
      };

      sendMessage(senderId, { text: 'Loading owner information and video...' }, pageAccessToken);

      try {
        // Download the video (same as before)
        const videoUrl ='https://i.imgur.com/hRSVKhD.jpeg'; // Replace with your Google Drive video id
        const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });

        const tmpFolderPath = path.join(__dirname, 'tmp');
        if (!fs.existsSync(tmpFolderPath)) {
          fs.mkdirSync(tmpFolderPath);
        }

        const videoPath = path.join(tmpFolderPath, 'owner_video.mp4');
        fs.writeFileSync(videoPath, Buffer.from(videoResponse.data, 'binary'));

        // Construct the response message with a link to the video
        const response = `Owner Information:🧾\nName: ${ownerInfo.name}\nGender: ${ownerInfo.gender}\nAge: ${ownerInfo.age}\nHeight: ${ownerInfo.height}\nFacebook: ${ownerInfo.facebookLink}\nNick: ${ownerInfo.nick}\n\nHere's the video: ${videoUrl}`;

        // Send the message with the video link
        sendMessage(senderId, { text: response }, pageAccessToken);

        // Delete the temporary video file after sending
        fs.unlink(videoPath, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log("File deleted successfully:", videoPath);
          }
        });

      } catch (error) {
        console.error("Error occurred:", error);
        sendMessage(senderId, { text: `An error occurred: ${error.message}` }, pageAccessToken);
      } finally {
        sendMessage(senderId, { text: 'Owner information and video loaded!' }, pageAccessToken);
      }

    } catch (error) {
      console.error('Error getting owner information and video:', error);
      sendMessage(senderId, { text: 'There was an error getting owner information and video. Please try again later.' }, pageAccessToken);
    }
  }
};
