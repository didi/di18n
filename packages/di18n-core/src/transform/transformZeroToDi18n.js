const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const babel = require('@babel/core');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const pluginSyntaxJSX = require('@babel/plugin-syntax-jsx');
const pluginSyntaxProposalOptionalChaining = require('@babel/plugin-proposal-optional-chaining');
const pluginSyntaxClassProperties = require('@babel/plugin-syntax-class-properties');
const pluginSyntaxDecorators = require('@babel/plugin-syntax-decorators');
const pluginSyntaxObjectRestSpread = require('@babel/plugin-syntax-object-rest-spread');
const pluginSyntaxAsyncGenerators = require('@babel/plugin-syntax-async-generators');
const pluginSyntaxDoExpressions = require('@babel/plugin-syntax-do-expressions');
const pluginSyntaxDynamicImport = require('@babel/plugin-syntax-dynamic-import');
const pluginSyntaxExportExtensions = require('@babel/plugin-syntax-export-extensions');
const pluginSyntaxFunctionBind = require('@babel/plugin-syntax-function-bind');
const presetTypescript = require('@babel/preset-typescript');
const reactPlugin = require('../plugin/zeroToDi18nReact');
const vuePlugin = require('../plugin/zeroToDi18nVue');
const log = require('../utils/log');

const emptyLineSymbol = '// ___Di18N_____BLANK';

function getIgnoreLines(sourceCode) {
  const rgxDisable = /^[\t ]*\/\* *di18n-disable *\*\/$/;
  const rgxEnable = /^[\t ]*\/\* *di18n-enable *\*\/$/;
  const rgxDisableLine = /\/\/ *di18n-disable-line *$/;

  const ignores = [];
  const lines = sourceCode.split(/\n|\r\n/g);
  for (let i = 0, isDisable = false; i < lines.length; i++) {
    if (rgxEnable.test(lines[i])) {
      ignores.push(i + 1);
      isDisable = false;
    } else if (rgxDisable.test(lines[i])) {
      ignores.push(i + 1);
      isDisable = true;
    } else if (isDisable || rgxDisableLine.test(lines[i])) {
      // start with number 1
      ignores.push(i + 1);
    }
  }

  return ignores;
}

function getSpecialCodeLine(sourceCode) {
  const lines = sourceCode.split(/\n|\r\n/g);
  const placeHolders = {};

  for (let i = 0; i < lines.length; i++) {
    let key = '';
    if (lines[i].trim() === '') {
      key = emptyLineSymbol;
    }

    if (key) {
      placeHolders[key] = lines[i];
      lines[i] = key;
    }
  }

  return {
    code: lines.join('\r\n'),
    placeHolders,
  };
}

function removeSpecialCodeLine(sourceCode, placeHolders) {
  const lines = sourceCode.split(/\n|\r\n/g);

  for (let i = 0; i < lines.length; i++) {
    const lineAsKey = lines[i].trim();
    if (lineAsKey in placeHolders) {
      lines[i] = placeHolders[lineAsKey];
    }
  }

  return lines.join('\r\n');
}

function transformReact(
  codeFileInfo,
  allTranslatedWord,
  updatedTranslatedWord,
  keysInUse,
  option
) {
  const { filePath, currentEntry, currentOutput } = codeFileInfo;
  const {
    intlAlias,
    ignoreComponents,
    ignoreMethods,
    importCode,
    i18nObject,
    i18nMethod,
  } = option;

  const sourceCode = fs.readFileSync(filePath, 'utf8');
  const ignoreLines = getIgnoreLines(sourceCode);

  let outObj = {
    hasReactIntlUniversal: false,
    translateWordsNum: 0,
    keysInUse: keysInUse,
  };

  let presets = [];

  if (['.ts', '.tsx'].includes(path.extname(filePath))) {
    presets = [
      [presetTypescript, { isTSX: true, allExtensions: true }],
    ];
  }

  const transformOptions = {
    sourceType: 'module',
    ast: true,
    presets,
    plugins: [
      pluginSyntaxJSX,
      pluginSyntaxProposalOptionalChaining,
      pluginSyntaxClassProperties,
      [pluginSyntaxDecorators, { legacy: true }],
      pluginSyntaxObjectRestSpread,
      pluginSyntaxAsyncGenerators,
      pluginSyntaxDoExpressions,
      pluginSyntaxDynamicImport,
      pluginSyntaxExportExtensions,
      pluginSyntaxFunctionBind,
    ],
  };

  const { code: sourceCode2, placeHolders } = getSpecialCodeLine(sourceCode);
  const ast = babel.parseSync(sourceCode2, transformOptions);

  const visitors = reactPlugin(
    allTranslatedWord,
    updatedTranslatedWord,
    outObj,
    intlAlias || i18nObject,
    i18nMethod,
    ignoreComponents,
    ignoreMethods,
    ignoreLines
  );

  traverse(ast, visitors);

  let { code } = generate(
    ast,
    {
      retainLines: true,
    },
    sourceCode2
  );

  code = removeSpecialCodeLine(code, placeHolders);

  if (outObj.translateWordsNum > 0) {
    if (!outObj.hasReactIntlUniversal) {
      if (intlAlias) {
        code = `import { intl as ${intlAlias} } from 'di18n-react';\n${code}`;
      } else {
        code = importCode + '\n' + code;
      }
    }

    code = prettier.format(code, option.prettier);

    const target = currentOutput
      ? filePath.replace(currentEntry, currentOutput)
      : filePath;
    fs.writeFileSync(target, code, { encoding: 'utf-8' });
    log.success(`done: ${outObj.translateWordsNum} words collected`);
  }
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

  const sourceCode = fs.readFileSync(filePath, 'utf8');
  const ignoreLines = getIgnoreLines(sourceCode);

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
    ignoreLines,
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
