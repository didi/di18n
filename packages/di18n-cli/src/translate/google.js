// https://github.com/matheuss/google-translate-api/issues/79#issuecomment-427841889
const googleTranslate = require('@vitalets/google-translate-api');

module.exports = function translateByGoogle(text, targetLang) {
  return googleTranslate(text, { client: 'gtx', to: targetLang });
};
