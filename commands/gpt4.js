const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');
const token = fs.readFileSync('token.txt', 'utf8');

// [ true if turn on font & false if turn off ]
const useFontFormatting = true;

module.exports = {
  name: 'gpt4',
  description: 'Interact to Free GPT - OpenAI.',
  author: 'Arn', // API by Kenlie Navacilla Jugarap

  async execute(senderId, args) {
    const pageAccessToken = token;
    const query = args.join(" ").toLowerCase();

    if (!query) {
      const defaultMessage = "🌟 Salut, que puis-je faire pour toi?";
      const formattedMessage = useFontFormatting ? formatResponse(defaultMessage) : defaultMessage;
      return await sendMessage(senderId, { text: formattedMessage }, pageAccessToken);
    }

    if (query === "sino creator mo?" || query === "who created you?") {
      const jokeMessage = "Arn/Rynx Gaiser";
      const formattedMessage = useFontFormatting ? formatResponse(jokeMessage) : jokeMessage;
      return await sendMessage(senderId, { text: formattedMessage }, pageAccessToken);
    }

    await handleChatResponse(senderId, query, pageAccessToken);
  },
};

const handleChatResponse = async (senderId, input, pageAccessToken) => {
  const apiUrl = "https://api.kenliejugarap.com/freegpt-openai/?";

  try {
    const { data } = await axios.get(apiUrl, { params: { question: input } });
    let response = data.response;

    const responseTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila', hour12: true });

    const answeringMessage = `🕗 Patientez...`;
    const formattedAnsweringMessage = useFontFormatting ? formatResponse(answeringMessage) : answeringMessage;
    await sendMessage(senderId, { text: formattedAnsweringMessage }, pageAccessToken);

    const defaultMessage = `[🟢] 𝐎𝐩𝐞𝐧𝐀𝐈

\n${response}\n`;

    const formattedMessage = useFontFormatting ? formatResponse(defaultMessage) : defaultMessage;

    await sendConcatenatedMessage(senderId, formattedMessage, pageAccessToken);
  } catch (error) {
    console.error('Error while processing AI response:', error.message);

    const errorMessage = '❌ Ahh sh1t error again.';
    const formattedMessage = useFontFormatting ? formatResponse(errorMessage) : errorMessage;
    await sendMessage(senderId, { text: formattedMessage }, pageAccessToken);
  }
};

const sendConcatenatedMessage = async (senderId, text, pageAccessToken) => {
  const maxMessageLength = 2000;

  if (text.length > maxMessageLength) {
    const messages = splitMessageIntoChunks(text, maxMessageLength);
    for (const message of messages) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await sendMessage(senderId, { text: message }, pageAccessToken);
    }
  } else {
    await sendMessage(senderId, { text }, pageAccessToken);
  }
};

const splitMessageIntoChunks = (message, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
};

function formatResponse(responseText) {
  const fontMap = {
    ' ': ' ',
    'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f', 'g': 'g', 'h': 'h',
    'i': 'i', 'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'o', 'p': 'p', 'q': 'q',
    'r': 'r', 's': 's', 't': 't', 'u': 'u', 'v': 'v', 'w': 'w', 'x': 'x', 'y': 'y', 'z': 'z',
    'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H',
    'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P', 'Q': 'Q',
    'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z',
  };

  return responseText.split('').map(char => fontMap[char] || char).join('');
}
// WhyWouldiCare
      
