const lex = require('pug-lexer');
const parse = require('pug-parser');
const genSource = require('pug-source-gen');
const mustache = require('mustache');
const prettier = require('prettier');
const transformJs = require('./transformJs');
const getIgnoreLines = require('../utils/getIgnoreLines');

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

function traversePug(ast, {
  primaryRegx,
  i18nMethod,
  ignoreLines,
}, returns) { // returesallTranslatedWord, updatedTranslatedWord, keysInUse, ignores) {
  const { allTranslated, allUpdated, allUsedKeys } = returns;
  const existValues = Object.keys(allTranslated);

  function shouldIgnore(node) {
    return node.line && ignoreLines.includes(node.line);
  }

  function isPrimary(str) {
    return primaryRegx.test(str);
  }

  function formatValue(value) {
    // 去掉首尾空白字符，中间的连续空白字符替换成一个空格
    value = value.trim().replace(/\s+/g, ' ');

    // 去掉首尾引号
    if (['"', "'"].includes(value.charAt(0))) {
      value = value.substring(1, value.length - 1);
    }

    return value;
  }

  // 更新2个 `all*` 数组
  function updateLocaleInfo(key, value) {
    if (!Array.isArray(allTranslated[value])) {
      // 如果该文字没有存在于已翻译列表
      allTranslated[value] = [key];
      existValues.push(key);
    }

    if (!allUsedKeys.includes(key)) {
      allUsedKeys.push(key);
    }
  }

  function transformJsExpression(source) {
    const { source: source1 } = transformJs(
      source,
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
      }
    );

    let code = prettier.format(source1, {
      parser: 'babel',
      singleQuote: true,
      semi: false,
    });

    code = code.trim().replace(/\s+/g, ' ');

    // 去掉开头的分号
    if (code[0] === ';') code = code.slice(1);

    return code;
  }

  function traverse(node) {
    if (node.type === 'Tag' && node.block) {
      traverse(node.block);
    }

    if (node.type === 'Block' && node.nodes) {
      node.nodes.forEach(nd => traverse(nd));
    }

    // 处理属性
    if (!shouldIgnore(node) && node.attrs) {
      node.attrs.forEach(attr => {
        const { name, val } = attr;

        // 非主语言，跳过
        if (!isPrimary(val)) return;

        if (name.startsWith('v-') || name.startsWith(':') || name.startsWith('@')) {
          // vue 指令
          let value = val;
          if (['"', "'"].includes(val.charAt(0))) {
            value = val.substring(1, val.length - 1);
          }

          // 引号里是 js 表达式，直接调用 transformJs 来转换
          const source = transformJsExpression(value);

          if (`"${source}"` !== val) {
            attr.val = `"${source}"`;
            returns.hasTouch = true;
          }
        } else {
          // 普通属性（应该不会有人在模板里写 onclick 等事件吧，故不考虑事件）
          let key = formatValue(val);

          if (allUpdated.hasOwnProperty(key)) {
            key = allUpdated[key];
          }

          attr.val = `"${i18nMethod}('${key}')"`;
          attr.name = `:${name}`;
          returns.hasTouch = true;
        }
      });
    }

    // 处理 innerText
    if (!shouldIgnore(node) && node.type === 'Text') {
      if (!isPrimary(node.val)) return;

      let value = '';
      const tokens = mustache.parse(node.val);

      for (const token of tokens) {
        // token 结构：[类型(text|name), 值, 起始位置(包含), 终止位置(不包含)]
        if (!isPrimary(token[1])) {
          if (token[0] === 'text') value += token[1];
          else if (token[0] === 'name') value += `{{${token[1]}}}`;
        } else {
          if (token[0] === 'text') {
            const key = token[1].trim();
            value += `{{${i18nMethod}('${key}')}}`;

            updateLocaleInfo(key, key);
          } else if (token[0] === 'name') {
            const source = transformJsExpression(token[1]);
            value += `{{${source}}}`;
          }
        }
      }

      if (node.val !== value) {
        node.val = value;
        returns.hasTouch = true;
      }
    }
  }

  // 执行遍历
  traverse(ast);
}

module.exports = function transformPug(source, localeInfo = {}, options = {}) {
  const {
    allTranslated = {},
    allUpdated = {},
    allUsedKeys = [],
  } = localeInfo;

  const {
    primaryRegx = /[\u4e00-\u9fa5]/,
    i18nMethod = '$t',

    /* 以下暂时不需要
    i18nObject = '',
    importCode = '',
    babelPresets = [],
    babelPlugins = [],
    ignoreComponents = [],
    ignoreMethods = [],
    以上暂时不需要 */
  } = options;

  const opts = {
    primaryRegx,
    i18nMethod,
    ignoreLines: [],
  };

  const r = {
    allTranslated,
    allUpdated,
    allUsedKeys,
    hasTouch: false,
  };

  opts.ignoreLines = getIgnoreLines(source);
  const tokens = lex(source.trim());

  const ast = parse(tokens);
  traversePug(ast, opts, r);

  let code = source;
  if (r.hasTouch) {
    const genCode = genSource(ast);
    code = prettier.format(genCode, {
      filepath: 'xxx.pug',
      pugAttributeSeparator: 'none',
    }).trim();
  }

  return { source: code, hasTouch: r.hasTouch };
};
