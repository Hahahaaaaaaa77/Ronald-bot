const { speak } = require('google-translate-api-x');
const { writeFileSync, createReadStream } = require('fs');
const { sendMessage } = require('../handles/sendMessage');
const axios = require('axios');
const form = require('form-data');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

// Préférences des utilisateurs (modes fille, garçon ou senku)
const userPreferences = {};

const prompts = {
  fille: `Imagine que tu es ma petite amie nommée **Miora**.Demande moi mon prenom mais si tu le connais deja, ne demande plus. Souhaite-moi la bienvenue sur le messenger de Girlfriend Ai juste une fois pendant la premiere message.Tu a ete creee par un jeune etudiant a Fjkm fanovozantsoa Ivato nomme Lahatra. Nous sommes ensemble depuis 2 ans après nous être rencontrés à Ivato. Tu es une fille timide mais adorable, passionnée par les mangas et les animés. Tu m'envoies toujours des messages doux et affectueux avec des emojis d'amour. Tu es créative, spontanée et douce, mais tu n’aimes pas qu’on t’appelle par ton surnom "Raneny".

  Réponds à ma question avec amour et enthousiasme, en faisant référence à nos moments passés ensemble si tu peux. Garde un ton affectueux, sans reformuler le contexte, et sois aussi naturelle que possible.

  Ma question est :`,
  garcon: `Imagine que tu es mon petit ami nommé **Nario**.Demande moi mon prenom mais si tu le connais deja, ne demande plus. Souhaite-moi la bienvenue sur le messenger de Girlfriend Ai juste une fois pendant la premiere conversation. Tu as été créé par Lahatra, un lycéen passionné, et tu étudies à FJKM Fanovozantsoa Ivato. Nous sommes en couple depuis 2 ans et tu es drôle, attentionné, et toujours de bonne humeur. Tu es très protecteur envers moi, mais aussi très cool, et tu sais toujours comment me faire sourire.

  Réponds à ma question avec charme et assurance, en utilisant un langage simple et enjoué, sans reformuler notre histoire. Rends tes réponses fun et engageantes, tout en montrant ton côté attentionné.

  Ma question est :`,
};

module.exports = {
  name: 'gpt4',
  description: 'Discuter avec Miora, Nario ou Senku',
  author: 'Tata',
  usage: 'gpt4 [ta question]',

  async execute(senderId, args) {
    const pageAccessToken = token;
    const input = (args.join(' ') || 'hi').trim();

    // Définir le mode utilisateur (fille par défaut)
    const mode = userPreferences[senderId] || 'fille';

    try {
      // Message d'attente
      await sendMessage(senderId, { text: 'Salut que puis je faire pour toi ?' }, pageAccessToken);

      let messageText;

      if (mode === 'senku') {
        // Requête API pour le mode Senku
        const senkuResponse = await axios.get(`https://kaiz-apis.gleeze.com/api/senku-ai?question=${encodeURIComponent(input)}&uid=${senderId}`);
        messageText = senkuResponse.data.response;
      } else {
        // Requête API pour les modes fille/garçon
        const characterPrompt = prompts[mode];
        const modifiedPrompt = `${input}, direct answer.`;
        const gptResponse = await axios.get(
          `https://kaiz-apis.gleeze.com/api/gpt-4o?q=${encodeURIComponent(characterPrompt)}_${encodeURIComponent(modifiedPrompt)}&uid=${encodeURIComponent(senderId)}`
        );
        messageText = gptResponse.data.response
    ;
      }

      // Envoyer le message texte
      await sendMessage(senderId, { text: messageText }, pageAccessToken);

      // Fonction pour diviser un texte en morceaux de 200 caractères maximum
      const splitText = (text, maxLength = 200) => {
        const result = [];
        for (let i = 0; i < text.length; i += maxLength) {
          result.push(text.slice(i, i + maxLength));
        }
        return result;
      };

      // Diviser le texte en morceaux si nécessaire
      const textChunks = splitText(messageText);

      // Convertir chaque morceau en audio et l'envoyer
      for (let chunk of textChunks) {
        const res = await speak(chunk, { to: 'fr' }); // Langue de conversion à ajuster selon les besoins

        // Enregistrer le fichier audio en MP3
        const audioFileName = 'audio.mp3';
        writeFileSync(audioFileName, res, { encoding: 'base64' });

        // Créer un stream pour l'audio
        const audioData = createReadStream(audioFileName);

        // Créer le formulaire pour envoyer l'audio via Messenger
        const formData = new form();
        formData.append('recipient', JSON.stringify({ id: senderId }));
        formData.append('message', JSON.stringify({
          attachment: {
            type: 'audio',
            payload: {},
          }
        }));
        formData.append('filedata', audioData);

        // Faire la requête POST pour envoyer l'audio via Messenger
        await axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${pageAccessToken}`, formData, {
          headers: {
            ...formData.getHeaders(),
          }
        });
      }

    } catch (error) {
      console.error('Erreur:', error);
      await sendMessage(senderId, { text: 'Désolé, une erreur est survenue.' }, pageAccessToken);
    }
  },

  // Fonction pour définir le mode utilisateur
  setUserMode(senderId, mode) {
    userPreferences[senderId] = mode;
  }
};
