const compiler = require('vue-template-compiler');
const transformJs = require('./transformJs');
const transformPug = require('./transformPug');
const transformHtml = require('./transformHtml');

function openTag(sfcBlock) {
  const { type, lang, src, scoped, module, attrs } = sfcBlock;

  let tag = `<${type}`;
  if (lang) tag += ` lang="${lang}"`;
  if (src) tag += ` src="${src}"`;
  if (scoped) tag += ' scoped';
  if (module) {
    if (typeof module === 'string') tag += ` module="${module}"`;
    else tag += ' module';
  }
  for (let k in attrs) {
    if (!['type', 'lang', 'src', 'scoped', 'module'].includes(k)) {
      tag += ` ${k}="${attrs[k]}"`;
    }
  }
  tag += '>';

  return tag;
}

function closeTag(sfcBlock) {
  return '</' + sfcBlock.type + '>';
}

function combineVue(template, script, sytles, customBlocks) {
  return [template, script, ...sytles, ...customBlocks]
    .map(sfc => sfc ? `${openTag(sfc)}\n${sfc.content.trim()}\n${closeTag(sfc)}\n` : '')
    .join('\n');
}

module.exports = function transformVue(source, localeInfo = {}, options = {}) {
  const {
    allTranslated = {},
    allUpdated = {},
    allUsedKeys = [],
  } = localeInfo;

  const {
    primaryRegx = /[\u4e00-\u9fa5]/,
    i18nObject = 'intl',
    i18nMethod = '$t',
    importCode = "import { intl } from 'di18n-vue';",
    babelPresets = [],
    babelPlugins = [],
    ignoreComponents = [],
    ignoreMethods = [],
    pkMap = {},
  } = options;

  const sfc = compiler.parseComponent(source, {
    pad: 'space',
    deindent: false,
  });

  const { template, script, styles, customBlocks } = sfc;
  let hasTouch = false;
  
  if (template) {
    const templateType = (template.lang || 'html').toLowerCase();

    // transform template
    if (['html', 'pug'].includes(templateType)) {
      const transform = templateType === 'html' ? transformHtml : transformPug;

      const ret = transform(
        template.content,
        {
          allTranslated,
          allUpdated,
          allUsedKeys,
        },
        {
          primaryRegx,
          i18nObject: '',
          i18nMethod,
          importCode: '',
          babelPresets,
          babelPlugins,
          ignoreComponents,
          ignoreMethods,
          pkMap,
        }
      );

      template.content = ret.source;
      hasTouch = ret.hasTouch;
    } else {
      console.warn(`Unsupport type: ${templateType}, so the template is ignored`);
    }
  }

  // transform script
  if (script) {
    const ret = transformJs(
      script.content,
      {
        allTranslated,
        allUpdated,
        allUsedKeys,
      },
      {
        primaryRegx,
        i18nObject,
        i18nMethod,
        importCode,
        babelPresets,
        babelPlugins,
        ignoreComponents,
        ignoreMethods,
      }
    );

    script.content = ret.source;
    hasTouch = hasTouch || ret.hasTouch;
  }

  const code = combineVue(template, script, styles, customBlocks);

  return { source: code, hasTouch };
};
