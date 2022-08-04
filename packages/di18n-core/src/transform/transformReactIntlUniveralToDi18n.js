const glob = require('glob');
const fs = require('fs');
const prettier = require('prettier');
const babel = require('@babel/core');
const pluginSyntaxJSX = require('@babel/plugin-syntax-jsx');
const pluginSyntaxProposalOptionalChaining = require('@babel/plugin-proposal-optional-chaining');
const pluginSyntaxClassProperties = require('@babel/plugin-syntax-class-properties');
const pluginSyntaxDecorators = require('@babel/plugin-syntax-decorators');
const pluginSyntaxObjectRestSpread = require('@babel/plugin-syntax-object-rest-spread');
const pluginSyntaxAsyncGenerators = require('@babel/plugin-syntax-async-generators');
const pluginSyntaxDoExpressions = require('@babel/plugin-syntax-do-expressions');
const pluginSyntaxDynamicImport = require('@babel/plugin-syntax-dynamic-import');
const pluginSyntaxFunctionBind = require('@babel/plugin-syntax-function-bind');
const getConvert2Plugin = require('../plugin/reactIntlUniversalToDi18n');
const log = require('../utils/log');

function getSourceFiles({ entry, exclude }) {
  return glob.sync(`${entry}/**/*.{js,jsx}`, {
    ignore: exclude || [],
  });
}

function translate(codeFileInfo, allConverted, option) {
  const { filePath, currentEntry, currentOutput } = codeFileInfo;
  const { intlAlias } = option;

  const sourceCode = fs.readFileSync(filePath, 'utf8');

  let outObj = {
    translateWordsNum: 0,
  };

  const transformOptions = {
    sourceType: 'module',
    plugins: [
      pluginSyntaxJSX,
      pluginSyntaxProposalOptionalChaining,
      pluginSyntaxClassProperties,
      [pluginSyntaxDecorators, { legacy: true }],
      pluginSyntaxObjectRestSpread,
      pluginSyntaxAsyncGenerators,
      pluginSyntaxDoExpressions,
      pluginSyntaxDynamicImport,
      pluginSyntaxFunctionBind,
      getConvert2Plugin(outObj, allConverted, intlAlias),
    ],
    generatorOpts: {},
  };

  const bableObj = babel.transform(sourceCode, transformOptions);
  let { code } = bableObj;

  if (outObj.translateWordsNum > 0) {
    code = prettier.format(code, option.prettier);

    const target = currentOutput
      ? filePath.replace(currentEntry, currentOutput)
      : filePath;
    fs.writeFileSync(target, code, { encoding: 'utf-8' });
    log.success(`done: ${outObj.translateWordsNum} words collected`);
  }
}

module.exports = function transformReactIntlUniveralToDi18n(option) {
  const { entry, output, exclude } = option;

  if (!Array.isArray(entry) && typeof entry !== 'string') {
    log.error('entry must be a string or array');
    process.exit(2);
  }

  const allConverted = {};

  const outputs = output ? [].concat(output) : [];
  const targetFiles = [].concat(entry).reduce((prev, cur, index) => {
    const files = getSourceFiles({ entry: cur, exclude }).map(file => ({
      filePath: file,
      currentEntry: cur,
      currentOutput: outputs[index],
    }));
    return prev.concat(files);
  }, []);

  targetFiles.forEach(codeFileInfo => {
    translate(codeFileInfo, allConverted, option);
    log.success(`done: ${codeFileInfo.filePath}`);
  });

  return allConverted;
};
