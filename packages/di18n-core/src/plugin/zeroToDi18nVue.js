const fs = require('fs');
const prettier = require('prettier');
const compiler = require('vue-template-compiler');
const parse5 = require('parse5');
const parse = require('pug-parser');
const lex = require('pug-lexer');
const genSource = require('pug-source-gen');
const _transformJs = require('../transform/_transformJs');

/* eslint-disable */
// override to avoid unneeded escape: pug-source-gen/lib/code-generator.js
genSource.CodeGenerator.prototype.attrs = function(attrs) {
  var regularAttrs = [];
  var classes = '';
  var id;
  attrs.forEach(function(attr) {
    var constVal = '';
    try {
      constVal = constantinople.toConstant(attr.val);
    } catch (ex) {}

    if (attr.name === 'class' && !attr.escaped && constVal &&
               /^\-?[_a-z][_a-z0-9\-]*$/i.test(constVal)) {
      classes += '.' + constVal;
    } else if (attr.name === 'id' && !id && !attr.escaped && constVal &&
               /^[\w-]+$/.test(constVal)) {
      id = constVal;
    } else {
      var attrOut = '';

      // name
      if (/^\w[^()[\]=!,`'"\s]*$/.test(attr.name)) {
        attrOut += attr.name;
      } else {
        var name = attr.name.replace(/\\/g, '\\\\');
        attrOut += name;
      }

      if (!(typeof constVal === 'boolean' && constVal === true)) {
        // operator
        attrOut += '=';

        // value
        attrOut += attr.val;
      }

      regularAttrs.push(attrOut);
    }
  }.bind(this));

  var out = '';
  if (id) out += '#' + id;
  out += classes;
  if (regularAttrs.length) out += '(' + regularAttrs.join(' ') + ')';

  return out;
}
/* eslint-enable */

const matchReg = /[\u4e00-\u9fa5]+/g;
const matchQuoteReg = /['"][\u4e00-\u9fa5]+['"]/g;

function judgeChinese(text) {
  const val = typeof text === 'string' ? text.replace(/"|'/g, '') : text;
  return /[\u4e00-\u9fa5]/.test(val);
}

const replaceLineBreak = function(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/\n/g, ' ');
};

function makeReplace(text, allTranslatedWord, keysInUse, val) {
  let _text = text.match(/[\u4e00-\u9fa5]+/g)[0];

  const key = replaceLineBreak(_text).trim();

  allTranslatedWord[key] = [key];

  if (!keysInUse.includes(key)) {
    keysInUse.push(key);
  }

  if (val && val.includes('$t(')) {
    return `'${_text}'`;
  } else {
    return `$t('${_text}')`;
  }
}

function hasReplaced(text) {
  return text.indexOf('$t') >= 0;
}

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
    .map(sfc => `${openTag(sfc)}\n${sfc.content.trim()}\n${closeTag(sfc)}\n`)
    .join('\n');
}

function pascalToKebab(pascalStr) {
  if (pascalStr === '') return '';

  // 标记第一个字符的大小写
  let s = /[A-Z]/.test(pascalStr[0]) ? 's' : 'l';

  for (let i = 0; i < pascalStr.length; i++) {
    if (/[A-Z]/.test(pascalStr[i])) s += '-' + pascalStr[i].toLowerCase();
    else s += pascalStr[i];
  }

  return s;
}

function kebabToPascal(kebabStr) {
  if (kebabStr === '') return '';

  // 确定第一个字符的大小写
  let s = kebabStr[0] === 's' ? kebabStr[2].toUpperCase() : kebabStr[2];

  for (let i = 3; i < kebabStr.length; i++) {
    if (kebabStr[i] === '-') {
      i++;
      s += kebabStr[i].toUpperCase();
    } else {
      s += kebabStr[i];
    }
  }

  return s;
}

function getIgnoreLines(tpl) {
  // 仅支持 // di18n-disable 和 // di18n-enable 注释指令
  const ignores = [];
  let ignoring = false;

  const lines = tpl.split(/\n|\r\n/g);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('di18n-disable')) ignoring = true;
    if (lines[i].includes('di18n-enable')) ignoring = false;
    if (ignoring) ignores.push(i + 1);
  }

  return ignores;
}

function isIgnoreNode(node, ignores) {
  return node.line && ignores.includes(node.line);
}

/**
 * 将 html 转成 ast 遍历进行操作
 * @param  {} node
 * @param  {} allTranslatedWord
 * @param  {} keysInUse
 */
function traverse(node, allTranslatedWord, keysInUse) {
  // 处理属性
  if (node.attrs && node.attrs.length > 0) {
    node.attrs.forEach(attr => {
      if (judgeChinese(attr.value) && !hasReplaced(attr.value)) {
        // 有中文需要被替换，且没有被替换过。
        if (!attr.name.startsWith(':') && !attr.name.startsWith('v-')) {
          attr.value = makeReplace(
            attr.value,
            allTranslatedWord,
            keysInUse,
            attr.value
          );
          attr.name = ':' + attr.name;
        } else if (attr.name.startsWith(':') || attr.name.startsWith('v-')) {
          attr.value = attr.value.replace(matchQuoteReg, match => {
            return makeReplace(
              match,
              allTranslatedWord,
              keysInUse,
              attr.value
            );
          });
        }
      }
    });
  }
  // 处理innerText
  if (node.nodeName === '#text') {
    let value = node.value;
    if (judgeChinese(value) && !hasReplaced(value)) {
      // 有中文需要被替换，且没有被替换过。不过存在一个问题：只要被替换过了，如果再出现新的中文，新的中文就不会被处理
      if (value.indexOf('{{') < 0 || value.indexOf('}}') < 0) {
        // 没有{{}}的情况
        node.value = value.replace(matchReg, match => {
          return (
            '{{'
            + makeReplace(match, allTranslatedWord, keysInUse, value)
            + '}}'
          );
        });
      } else {
        const tmp = value.replace(/{{/, '{').replace(/}}/, '}');
        const code = `<T>${tmp}</T>`;

        node.val = code
          .replace(/{/, '{{')
          .replace(/}/, '}}')
          .replace('<T>', '')
          .replace('</T>', '')
          .replace(/;/, '');
      }
    }
  }

  if (node.childNodes && node.childNodes.length > 0) {
    node.childNodes.forEach(childnode => {
      traverse(childnode, allTranslatedWord, keysInUse);
    });
  }
}

/**
 * pug 模板转成 ast 遍历进行操作
 * @param  {} node
 * @param  {} allTranslatedWord
 * @param  {} keysInUse
 */
function traversePug(node, allTranslatedWord, keysInUse, ignores) {
  if (node.type === 'Tag' && node.block) {
    traversePug(node.block, allTranslatedWord, keysInUse, ignores);
  }

  if (node.type === 'Block' && node.nodes && node.nodes.length > 0) {
    node.nodes.forEach(obj => {
      traversePug(obj, allTranslatedWord, keysInUse, ignores);
    });
  }

  if (!isIgnoreNode(node, ignores) && node.attrs && node.attrs.length > 0) {
    node.attrs.forEach(attr => {
      if (judgeChinese(attr.val) && !hasReplaced(attr.val)) {
        // 有中文需要被替换，且没有被替换过。
        if (!attr.name.startsWith(':') && !attr.name.startsWith('v-')) {
          attr.val = makeReplace(
            attr.val,
            allTranslatedWord,
            keysInUse,
            attr.val
          );
          attr.name = ':' + attr.name;
        } else if (attr.name.startsWith(':') || attr.name.startsWith('v-')) {
          attr.val = attr.val.replace(matchQuoteReg, match => {
            return makeReplace(match, allTranslatedWord, keysInUse, attr.val);
          });
        }
      }
    });
  }

  // 处理innerText
  if (!isIgnoreNode(node, ignores) && node.type === 'Text') {
    let value = node.val;
    if (judgeChinese(value) && !hasReplaced(value)) {
      // 有中文需要被替换，且没有被替换过
      // TODO: 不过存在一个问题：只要被替换过了，如果再出现新的中文，新的中文就不会被处理
      // TODO: 表达式的情况，用 babel 解析为 AST 的形式解决
      if (value.indexOf('{{') < 0 || value.indexOf('}}') < 0) {
        // 没有{{}}的情况
        node.val = value.replace(matchReg, match => {
          return (
            '{{'
            + makeReplace(match, allTranslatedWord, keysInUse, value)
            + '}}'
          );
        });
      } else {
        const tmp = value.replace(/{{/, '{').replace(/}}/, '}');
        const code = `<T>${tmp}</T>`;

        node.val = code
          .replace(/{/, '{{')
          .replace(/}/, '}}')
          .replace('<T>', '')
          .replace('</T>', '')
          .replace(/;/, '');
      }
    }
  }
}

function splitVueFile(filePath) {
  const fileString = fs.readFileSync(filePath).toString();
  const sfc = compiler.parseComponent(fileString, {
    pad: 'space',
    deindent: false,
  });
  return sfc;
}

function generateTemplateCode(
  templateContent,
  allTranslatedWord,
  keysInUse,
  templateType
) {
  const ignores = getIgnoreLines(templateContent);

  if (templateType === 'pug') {
    const tokens = lex(templateContent.trim());
    let ast = parse(tokens); // 解析 pug 字符串
    traversePug(ast, allTranslatedWord, keysInUse, ignores); // 处理需要翻译的字段
    let pugstr = genSource(ast);
    return pugstr;
  }

  templateContent = pascalToKebab(templateContent);

  const document = parse5.parse(templateContent); // 解析 html 字符串
  const root = document.childNodes[0].childNodes[1];

  traverse(root, allTranslatedWord, keysInUse); // 处理需要翻译的字段

  let str = parse5.serialize(document); // 将 ast 节点序列化为 html 字符串
  let regresult = /(<template>).+(<\/template>)/g.exec(str);

  if (regresult && regresult[0]) {
    str = regresult[0];
  } else {
    str = str.slice(25, -14);
  }

  str = kebabToPascal(str);

  return str;
}

function translateVue({
  filePath,
  updatedTranslatedWord,
  allTranslatedWord,
  keysInUse,
  ignoreComponents,
  ignoreMethods,
}) {
  const {
    template,
    script,
    styles,
    customBlocks,
  } = splitVueFile(filePath);

  const templateContent = template.content;
  const templateType = template.lang || 'html';
  const scriptContent = script.content;

  const templatecode = generateTemplateCode(
    templateContent,
    allTranslatedWord,
    keysInUse,
    templateType
  );

  const scriptCode = _transformJs(
    scriptContent,
    allTranslatedWord,
    updatedTranslatedWord,
    keysInUse,
    {
      intlAlias: 'this',
      ignoreComponents: ignoreComponents || [],
      ignoreMethods: ignoreMethods || [],
      importCode: '',
      i18nObject: '',
      i18nMethod: '$t',
    }
  );

  template.content = templatecode;
  script.content = scriptCode;

  const code = combineVue(template, script, styles, customBlocks);

  return {
    code: prettier.format(code, {
      parser: 'vue',
      semi: false,
      singleQuote: true,
    }),

    isRewritten: true,
  };
}

module.exports = translateVue;
