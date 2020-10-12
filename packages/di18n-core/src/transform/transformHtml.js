const parse5 = require('parse5');
const Serializer = require('parse5/lib/serializer')
const prettier = require('prettier');
const mustache = require('mustache');
const transformJs = require('./transformJs');
const getIgnoreLines = require('../utils/getIgnoreLines');
const defaultPkMap = require('./defaultPkMap');

class MySerializer extends Serializer {
  _serializeAttributes(node) {
    const attrs = this.treeAdapter.getAttrList(node);

    for (let i = 0, attrsLength = attrs.length; i < attrsLength; i++) {
        const attr = attrs[i];
        const value = Serializer.escapeString(attr.value, true);

        this.html += ' ';

        if (!attr.namespace) {
            this.html += attr.name;
        } else if (attr.namespace === NS.XML) {
            this.html += 'xml:' + attr.name;
        } else if (attr.namespace === NS.XMLNS) {
            if (attr.name !== 'xmlns') {
                this.html += 'xmlns:';
            }

            this.html += attr.name;
        } else if (attr.namespace === NS.XLINK) {
            this.html += 'xlink:' + attr.name;
        } else {
            this.html += attr.prefix + ':' + attr.name;
        }

        // 避免出现 <p v-else="">xxx</p> 的情况
        if (value) {
            this.html += '="' + value + '"';
        }
    }
  }
}

function parse5Serialize(node, options) {
  const serializer = new MySerializer(node, options);

  return serializer.serialize();
}

function toKebab(tpl, pkMap = {}) {
  pkMap = { ...defaultPkMap, ...pkMap };

  Object.keys(pkMap).forEach(i => {
    tpl = (
      tpl
        .replace(new RegExp(`<${i}(?![a-zA-Z0-9-])`, 'g'), `<${pkMap[i]}`)
        .replace(new RegExp(`</${i}>`, 'g'), `</${pkMap[i]}>`)
    );
  });
  return tpl;
}

function toPascal(tpl, pkMap = {}) {
  pkMap = { ...defaultPkMap, ...pkMap };

  Object.keys(pkMap).forEach(i => {
    tpl = (
      tpl
        .replace(new RegExp(`<${pkMap[i]}(?![a-zA-Z0-9-])`, 'g'), `<${i}`)
        .replace(new RegExp(`</${pkMap[i]}>`, 'g'), `</${i}>`)
    );
  });
  return tpl;
}

function traverseHtml(ast, {
  primaryRegx,
  i18nMethod,
  ignoreLines,
}, returns) {
  const { allTranslated, allUpdated, allUsedKeys } = returns;
  const existValues = Object.keys(allTranslated);

  function shouldIgnore(node) {
    return (
      node.sourceCodeLocation
      && ignoreLines.includes(node.sourceCodeLocation.startLine)
    );
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
    const { source: source1, hasTouch } = transformJs(
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

    if (!hasTouch) return source;

    return prettier.format(source1, {
      parser: 'babel',
      singleQuote: true,
      semi: false,
    }).trim();
  }

  function traverse(node) {
    if (node.childNodes) {
      node.childNodes.forEach(childNode => traverse(childNode));
    }

    // 处理属性
    if (!shouldIgnore(node) && node.attrs) {
      node.attrs.forEach(attr => {
        const { name, value } = attr;

        // 非主语言或空，跳过
        if (!isPrimary(value) || !value) return;

        if (name.startsWith('v-') || name.startsWith(':') || name.startsWith('@')) {
          // vue 指令
          // 引号里是 js 表达式，直接调用 transformJs 来转换
          const source = transformJsExpression(value);

          if (value !== source) {
            attr.value = source;
            returns.hasTouch = true;
          }
        } else {
          // 普通属性（不考虑事件）
          let key = formatValue(value);

          if (allUpdated.hasOwnProperty(key)) {
            key = allUpdated[key];
          }

          attr.value = `${i18nMethod}('${key}')`;
          attr.name = `:${name}`;
          returns.hasTouch = true;

          updateLocaleInfo(key, key);
        }
      });
    }

    // 处理 innerText
    if (!shouldIgnore(node) && node.nodeName === '#text') {
      if (!isPrimary(node.value)) return;

      let value = '';
      const tokens = mustache.parse(node.value);

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
            value += `{{${transformJsExpression(token[1])}}}`;
          }
        }
      }

      if (node.value !== value) {
        node.value = value;
        returns.hasTouch = true;
      }
    }
  }

  // 可能有 #comment 节点，需要找到 html 节点
  const html = ast.childNodes.find(nd => nd.nodeName === 'html');

  if (html) {
    // 再找 body 节点
    const body = html.childNodes.find(nd => nd.nodeName === 'body');

    // 遍历
    if (body) traverse(body);
  }
}

module.exports = function transformHtml(source, localeInfo = {}, options = {}) {
  const {
    allTranslated = {},
    allUpdated = {},
    allUsedKeys = [],
  } = localeInfo;

  const {
    primaryRegx = /[\u4e00-\u9fa5]/,
    i18nMethod = '$t',
    pkMap = {},

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

  const ast = parse5.parse(toKebab(source, pkMap), { sourceCodeLocationInfo: true });
  traverseHtml(ast, opts, r);

  let code = toPascal(parse5Serialize(ast), pkMap);

  // 只需要 body 内的
  code = code.split('<body>')[1].split('</body>')[0];

  code = r.hasTouch ? code : source;

  return { source: code, hasTouch: r.hasTouch };
};
