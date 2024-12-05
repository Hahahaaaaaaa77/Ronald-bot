const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { sendMessage } = require('./sendMessage');

const commands = new Map();
const prefix = '-';

// Load command modules
fs.readdirSync(path.join(__dirname, '../commands'))
  .filter(file => file.endsWith('.js'))
  .forEach(file => {
    try {
      const command = require(`../commands/${file}`);
      if (command.name && typeof command.name === 'string') {
        commands.set(command.name.toLowerCase(), command);
      }
    } catch (error) {
      console.error(`Error loading command module ${file}:`, error);
    }
  });

async function handleMessage(event, pageAccessToken) {
  const senderId = event?.sender?.id;
  if (!senderId) return console.error('Invalid event object');

  const messageText = event?.message?.text?.trim();
  const attachments = event?.message?.attachments;

  // Check if the message contains an image and automatically execute the 'gemini' command for analysis
  if (attachments && attachments[0].type === 'image') {
    const imageUrl = attachments[0].payload.url;
    const geminiCommand = commands.get('gemini');

    if (geminiCommand) {
      try {
        await geminiCommand.execute(senderId, [], pageAccessToken, event, imageUrl);
        return;
      } catch (error) {
        console.error("Error executing the Gemini command:", error);
        await sendMessage(senderId, { text: "Error analyzing the image with Gemini." }, pageAccessToken);
      }
    } else {
      await sendMessage(senderId, { text: "The Gemini command is not available." }, pageAccessToken);
    }
    return;
  }

  if (!messageText) return console.log('Received event without message text');

  // Command processing
  const [commandName, ...args] = messageText.startsWith(prefix)
    ? messageText.slice(prefix.length).split(' ')
    : messageText.split(' ');

  if (commands.has(commandName.toLowerCase())) {
    const command = commands.get(commandName.toLowerCase());
    try {
      let imageUrl = '';
      if (event.message?.reply_to?.mid) {
        try {
          imageUrl = await getAttachments(event.message.reply_to.mid, pageAccessToken);
        } catch (error) {
          console.error("Error retrieving the image from the reply:", error);
        }
      } else if (event.message.attachments?.[0]?.type === 'image') {
        imageUrl = event.message.attachments[0].payload.url;
      }

      await command.execute(senderId, args, pageAccessToken, event, imageUrl);
    } catch (error) {
      console.error(`Error executing command "${commandName}":`, error);
      await sendMessage(senderId, { text: `Error executing command "${commandName}". Please try again.` }, pageAccessToken);
    }
  } else if (commands.has('gpt')) {
    // Execute the 'gpt' command as a fallback command
    try {
      await commands.get('gpt').execute(senderId, [messageText], pageAccessToken);
    } catch (error) {
      console.error("Error executing the 'gpt' command:", error);
      await sendMessage(senderId, { text: 'An error occurred while executing the GPT command.' }, pageAccessToken);
    }
  } else {
    await sendMessage(senderId, {
      text: `Unknown command: "${commandName}". Type "help" to see the list of available commands.`,
      quick_replies: [
        {
          content_type: "text",
          title: "Help",
          payload: "HELP_PAYLOAD"
        }
      ]
    }, pageAccessToken);
  }
}

async function getAttachments(mid, pageAccessToken) {
  if (!mid) throw new Error("No message ID provided.");

  try {
    const { data } = await axios.get(`https://graph.facebook.com/v21.0/${mid}/attachments`, {
      params: { access_token: pageAccessToken }
    });

    if (data?.data?.length > 0 && data.data[0].image_data) {
      return data.data[0].image_data.url;
    } else {
      throw new Error("No image found in the replied message.");
    }
  } catch (error) {
    console.error("Error retrieving attachments:", error);
    throw new Error("Failed to retrieve attachments.");
  }
}

module.exports = { handleMessage };
