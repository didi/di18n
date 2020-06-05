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
const log = require('../utils/log');

const emptyLineSymbol = '// ___Di18N_____BLANK';

function getIgnoreLines(ast) {
  const ignoreBlocks = [];
  for (const comment of ast.comments) {
    const { type, value, loc } = comment;
    const last = ignoreBlocks.length - 1;

    if (type === 'CommentLine' && value.trim() === 'di18n-disable-line') {
      ignoreBlocks.push({
        start: loc.start.line,
        end: loc.start.line,
      });
    } else if (type === 'CommentBlock' && value.trim() === 'di18n-disable') {
      if (last < 0 || ignoreBlocks[last].end) {
        ignoreBlocks.push({
          start: loc.start.line,
        });
      }
    } else if (type === 'CommentBlock' && value.trim() === 'di18n-enable') {
      if (last >= 0 && !ignoreBlocks[last].end) {
        ignoreBlocks[last].end = loc.start.line;
      }
    }
  }

  // 如果缺少 disable-enable，直接作用到最后一行
  const len = ignoreBlocks.length;
  if (len > 0 && !ignoreBlocks[len - 1].end) {
    ignoreBlocks[len - 1].end = ast.loc.end.line;
  }

  // 转换成行
  const ignoreLines = [];
  for (const block of ignoreBlocks) {
    for (let i = block.start; i <= block.end; i++) {
      ignoreLines.push(i);
    }
  }

  return ignoreLines;
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

module.exports = function _transformJs(
  sourceCode,
  allTranslatedWord,
  updatedTranslatedWord,
  keysInUse,
  option
) {
  const {
    intlAlias,
    ignoreComponents,
    ignoreMethods,
    importCode,
    i18nObject,
    i18nMethod,
    isTSX,
  } = option;


  let outObj = {
    hasReactIntlUniversal: false,
    translateWordsNum: 0,
    keysInUse: keysInUse,
  };

  let presets = [];

  if (isTSX) {
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

  const ignoreLines = getIgnoreLines(ast);

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
      if (intlAlias && intlAlias !== 'this') {
        code = `import { intl as ${intlAlias} } from 'di18n-react';\n${code}`;
      } else {
        code = importCode + '\n' + code;
      }
    }

    code = prettier.format(code, option.prettier);

    log.success(`done: ${outObj.translateWordsNum} words collected`);
    return code;
  }

  return sourceCode;
};
