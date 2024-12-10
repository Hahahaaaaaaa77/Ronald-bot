const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');
const openAiApiKey = fs.readFileSync('token.txt', 'utf8').trim();

// [ true if turn on font & false if turn off ]
const useFontFormatting = true;

module.exports = {
  name: 'ai',
  description: 'Interact with OpenAI ChatGPT.',
  author: 'Ronald',

  async execute(senderId, args) {
    const query = args.join(" ").trim();

    if (!query) {
      const defaultMessage = "🌟 Hi, how can I assist you today?";
      const formattedMessage = useFontFormatting ? formatResponse(defaultMessage) : defaultMessage;
      return await sendMessage(senderId, { text: formattedMessage }, openAiApiKey);
    }

    if (query.toLowerCase() === "who created you?") {
      const jokeMessage = "Arn/Rynx Gaiser";
      const formattedMessage = useFontFormatting ? formatResponse(jokeMessage) : jokeMessage;
      return await sendMessage(senderId, { text: formattedMessage }, openAiApiKey);
    }

    await handleChatResponse(senderId, query, openAiApiKey);
  },
};

const handleChatResponse = async (senderId, input, apiKey) => {
  const apiUrl = "https://api.openai.com/v1/chat/completions";

  try {
    const response = await axios.post(
      apiUrl,
      {
        model: "gpt-3.5-turbo", // or "gpt-4"
        messages: [{ role: "user", content: input }],
        max_tokens: 1000,
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiResponse = response.data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    const responseTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila', hour12: true });

    const answeringMessage = `🕗 Generating response...`;
    const formattedAnsweringMessage = useFontFormatting ? formatResponse(answeringMessage) : answeringMessage;
    await sendMessage(senderId, { text: formattedAnsweringMessage }, apiKey);

    const defaultMessage = `[🟢] ChatGPT

━━━━━━━━━━━━━ 
\n${aiResponse}\n
━━━━━━━━━━━━━
[⏰] ${responseTime}`;

    const formattedMessage = useFontFormatting ? formatResponse(defaultMessage) : defaultMessage;

    await sendConcatenatedMessage(senderId, formattedMessage, apiKey);
  } catch (error) {
    console.error('Error while processing AI response:', error.message);

    const errorMessage = '❌ Something went wrong while processing your request.';
    const formattedMessage = useFontFormatting ? formatResponse(errorMessage) : errorMessage;
    await sendMessage(senderId, { text: formattedMessage }, apiKey);
  }
};

const sendConcatenatedMessage = async (senderId, text, apiKey) => {
  const maxMessageLength = 2000;

  if (text.length > maxMessageLength) {
    const messages = splitMessageIntoChunks(text, maxMessageLength);
    for (const message of messages) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await sendMessage(senderId, { text: message }, apiKey);
    }
  } else {
    await sendMessage(senderId, { text }, apiKey);
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
