const fs = require('fs');
const path = require('path');
const glob = require('glob');
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
const pluginSyntaxExportExtensions = require('@babel/plugin-syntax-export-extensions');
const pluginSyntaxFunctionBind = require('@babel/plugin-syntax-function-bind');
const reactIntlToReactIntlUniversal = require('../plugin/reactIntlToReactIntlUniversal');
const log = require('../utils/log');

function getSourceFiles({ path, exclude }) {
  return glob.sync(`${path}/**/*.{js,jsx}`, {
    ignore: exclude || [],
  });
}

function getLocaleFiles({ path, exclude }) {
  return glob.sync(`${path}/**/zh-CN.{js,json}`, {
    ignore: exclude || [],
  });
}

/**
 * 代码转换为使用 react-intl-universal 版本
 * @param {object} option 命令行或者配置文件中传入的参数信息
 */
module.exports = function transformReactIntlToReactIntlUniversal(option) {
  const { entry, localeConf, exclude, importCode } = option;

  const targetFiles = getSourceFiles({ path: entry, exclude });
  const targetLocales = getLocaleFiles({ path: localeConf.folder, exclude });

  let zhData = {};

  targetLocales.forEach(element => {
    if (path.extname(element) === '.json') {
      const json = fs.readFileSync(element, {
        encoding: 'utf-8',
      });
      zhData = JSON.parse(json);
    } else if (path.extname(element) === '.js') {
      zhData = require(path.resolve(path.resolve(), element));
    }
  });

  function transformFile(filePath) {
    let outObj = {
      hasReactIntlUniversal: false,
      needRewrite: false,
    };

    const transformOptions = {
      babelrc: false,
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
        pluginSyntaxExportExtensions,
        pluginSyntaxFunctionBind,
        reactIntlToReactIntlUniversal(zhData, outObj),
      ],
      generatorOpts: {},
    };

    const bableObj = babel.transformFileSync(filePath, transformOptions);
    let { code } = bableObj;

    if (outObj.needRewrite) {
      if (!outObj.hasReactIntlUniversal) {
        code = importCode + '\n' + code;
      }

      code = prettier.format(code, option.prettier);

      fs.writeFileSync(filePath, code, { encoding: 'utf-8' });
    }
  }

  targetFiles.forEach(element => {
    log.info(`start: ${element}`);
    transformFile(element);
    log.success(`done: ${element}`);
  });
};
