const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const transformTs = require('./transformTs');
const transformJs = require('./transformJs');
const transformVue = require('./transformVue');
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

  const transform = isTSX ? transformTs : transformJs;

  const { source, hasTouch } = transform(
    sourceCode,
    {
      allTranslated: allTranslatedWord,
      allUpdated: updatedTranslatedWord,
      allUsedKeys: keysInUse,
    },
    option
  );

  if (hasTouch) {
    const code = prettier.format(source, { ...option.prettier, parser: 'babel' });

    const target = currentOutput
      ? filePath.replace(currentEntry, currentOutput)
      : filePath;
    fs.writeFileSync(target, code, { encoding: 'utf-8' });
  }
}

function transformVueAdapter(
  codeFileInfo,
  allTranslatedWord,
  updatedTranslatedWord,
  keysInUse,
  option
) {
  const { filePath, currentEntry, currentOutput } = codeFileInfo;
  const sourceCode = fs.readFileSync(filePath, 'utf8');

  const { source, hasTouch } = transformVue(
    sourceCode,
    {
      allTranslated: allTranslatedWord,
      allUpdated: updatedTranslatedWord,
      allUsedKeys: keysInUse,
    },
    option
  );

  if (hasTouch) {
    const code = prettier.format(source, { ...option.prettier, parser: 'vue' });

    const target = currentOutput
      ? filePath.replace(currentEntry, currentOutput)
      : filePath;
    fs.writeFileSync(target, code, { encoding: 'utf-8' });
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
  const doTransform = ext === '.vue' ? transformVueAdapter : transformReact;
  log.info(codeFileInfo.filePath);
  doTransform(
    codeFileInfo,
    allTranslatedWord,
    updatedTranslatedWord,
    keysInUse,
    option
  );
};
