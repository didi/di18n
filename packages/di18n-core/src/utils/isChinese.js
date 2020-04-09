module.exports = function isChinese(text) {
  return /[\u4e00-\u9fa5]/.test(text);
};
