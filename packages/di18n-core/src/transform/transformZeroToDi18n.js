const fs = require('fs');
const path = require('path');
const vuePlugin = require('../plugin/zeroToDi18nVue');
const _transformJs = require('./_transformJs');
const log = require('../utils/log');

function transformReact(
  codeFileInfo,
  allTranslatedWord,
  updatedTranslatedWord,
  keysInUse,
  option
) {
  const { filePath, currentEntry, currentOutput } = codeFileInfo;
  const sourceCode = fs.readFileSync(filePath, 'utf8');
  const isTSX = ['.ts', '.tsx'].includes(path.extname(filePath));

  const code = _transformJs(
    sourceCode,
    allTranslatedWord,
    updatedTranslatedWord,
    keysInUse,
    { ...option, isTSX }
  );

  const target = currentOutput
    ? filePath.replace(currentEntry, currentOutput)
    : filePath;
  fs.writeFileSync(target, code, { encoding: 'utf-8' });
}

function transformVue(
  codeFileInfo,
  allTranslatedWord,
  updatedTranslatedWord,
  keysInUse,
  option
) {
  const { filePath, currentEntry, currentOutput } = codeFileInfo;
  const { ignoreComponents, ignoreMethods } = option;

  let outObj = {
    hasReactIntlUniversal: false,
    translateWordsNum: 0,
    keysInUse: keysInUse,
  };

  const { code, isRewritten } = vuePlugin({
    filePath,
    allTranslatedWord,
    updatedTranslatedWord,
    keysInUse,
    ignoreComponents,
    ignoreMethods,
  });

  if (isRewritten) {
    const target = currentOutput
      ? filePath.replace(currentEntry, currentOutput)
      : filePath;
    fs.writeFileSync(target, code, { encoding: 'utf-8' });
    log.success(`done: ${outObj.translateWordsNum} words collected`);
  }
}

/**
 * 转换 react 和 普通 js 文件
 * @param {object} codeFileInfo 源码文件信息
 * @param {object} allTranslatedWord 现有的中文资源
 * @param {object} updatedTranslatedWord 在远端做过中文文案修改的 key/value
 * @param {array}  keysInUse 使用中的key
 * @param {object} option 透传过来的 di18n 配置
 */
module.exports = function transformZeroToDi18n(
  codeFileInfo,
  allTranslatedWord,
  updatedTranslatedWord,
  keysInUse,
  option
) {
  const { ext } = codeFileInfo;
  const doTransform = ext === '.vue' ? transformVue : transformReact;
  log.info(codeFileInfo.filePath);
  doTransform(
    codeFileInfo,
    allTranslatedWord,
    updatedTranslatedWord,
    keysInUse,
    option
  );
};
