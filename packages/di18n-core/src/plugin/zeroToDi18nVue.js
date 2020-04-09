const fs = require('fs');
const prettier = require('prettier');
const compiler = require('vue-template-compiler');
const parse5 = require('parse5');
const parse = require('pug-parser');
const lex = require('pug-lexer');
const genSource = require('pug-source-gen');
const getPlugin = require('./zeroToDi18nReact');
const tagReplace = require('./replace-i-tag');

const matchReg = /[\u4e00-\u9fa5]+/g;
const matchQuoteReg = /['"][\u4e00-\u9fa5]+['"]/g;

let transformJS = val => ({ code: val });

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
            return makeReplace(match, allTranslatedWord, keysInUse, attr.value);
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
        const code = transformJS(`<T>${tmp}</T>`).code || '';

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
function traversePug(node, allTranslatedWord, keysInUse) {
  if (node.type === 'Tag' && node.block) {
    traversePug(node.block, allTranslatedWord, keysInUse);
  }

  if (node.attrs && node.attrs.length > 0) {
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
  if (node.type === 'Text') {
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
        const code = transformJS(`<T>${tmp}</T>`).code || '';

        node.val = code
          .replace(/{/, '{{')
          .replace(/}/, '}}')
          .replace('<T>', '')
          .replace('</T>', '')
          .replace(/;/, '');
      }
    }
  }

  if (node.type === 'Block' && node.nodes && node.nodes.length > 0) {
    node.nodes.forEach(obj => {
      traversePug(obj, allTranslatedWord, keysInUse);
    });
  }
}

function splitVueFile(filePath) {
  let fileString = fs.readFileSync(filePath).toString();
  let vueFile = compiler.parseComponent(fileString, {
    pad: 'space',
    deindent: false,
  });
  const templateContent = vueFile.template.content;
  const scriptContent = vueFile.script.content;
  const styleContent = vueFile.styles.map(s => s.content).join('\n');
  const templateType = vueFile.template.lang || 'html'; // 获取模板类型，默认为 html
  const styleType = (vueFile.styles.length && vueFile.styles[0].lang) || 'css'; // 获取 style 类型，默认为 css(前面将多个styleContent合并一起了，以至于后面获取 styletype 只默认取第一个)

  return {
    templateContent,
    scriptContent,
    styleContent,
    templateType,
    styleType,
  };
}

function generateTemplateCode(
  templateContent,
  allTranslatedWord,
  keysInUse,
  templateType
) {
  if (templateType === 'pug') {
    const tokens = lex(templateContent.trim());
    let ast = parse(tokens); // 解析 pug 字符串
    traversePug(ast, allTranslatedWord, keysInUse); // 处理需要翻译的字段
    let pugstr = genSource(ast);
    return pugstr;
  }

  templateContent = tagReplace.replaceTemplateTag1(templateContent);

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

  str = tagReplace.replaceTemplateTag2(str);

  return str;
}

// Script片段生成ast
function generateAST(source) {
  return {
    code: source,
  };

  // FIXME: [BABEL] unknown: .ImportDeclaration is not a valid Plugin property
  // let result = babel.transform(
  //   source,
  //   options
  // );
  // let code1 = result.code;
  // let map = result.map;
  // let metadata = result.metadata;
  // let ast = result.ast;

  // if (
  //   map &&
  //   (!map.sourcesContent ||
  //     !map.sourcesContent.length)
  // ) {
  //   map.sourcesContent = [source];
  // }

  // return {
  //   code: code1,
  //   map: map,
  //   metadata: metadata,
  //   ast: ast,
  // };
}

function translateVue({
  filePath,
  updatedTranslatedWord,
  allTranslatedWord,
  keysInUse,
  ignoreComponents,
  ignoreMethods,
  ignoreLines,
}) {
  const outObj = {
    hasReactIntlUniversal: false,
    translateWordsNum: 0,
    keysInUse: keysInUse,
  };

  const plugin = getPlugin(
    allTranslatedWord,
    updatedTranslatedWord,
    outObj,
    'this' /* intlAlias */,
    '$t' /* translate method */,
    ignoreComponents,
    ignoreMethods,
    ignoreLines
  );

  const {
    templateContent,
    scriptContent,
    styleContent,
    templateType,
    styleType,
  } = splitVueFile(filePath);

  // const pluginForTpl = getPlugin(
  //   allTranslatedWord,
  //   updatedTranslatedWord,
  //   outObj,
  //   '' /* intlAlias */,
  //   '$t' /* translate method */,
  //   ignoreComponents,
  //   ignoreMethods,
  //   ignoreLines
  // );

  // FIXME: [BABEL] unknown: .ImportDeclaration is not a valid Plugin property
  // transformJS = souceCode =>
  //   generateAST(souceCode, {
  //     sourceType: 'module',
  //     plugins: [
  //       '@babel/plugin-syntax-jsx',
  //       '@babel/plugin-proposal-optional-chaining',
  //       '@babel/plugin-syntax-class-properties',
  //       ['@babel/plugin-syntax-decorators', { legacy: true }],
  //       '@babel/plugin-syntax-object-rest-spread',
  //       '@babel/plugin-syntax-async-generators',
  //       '@babel/plugin-syntax-do-expressions',
  //       '@babel/plugin-syntax-dynamic-import',
  //       '@babel/plugin-syntax-export-extensions',
  //       '@babel/plugin-syntax-function-bind',
  //       pluginForTpl,
  //     ],
  //   });
  transformJS = souceCode => souceCode;

  const templatecode = generateTemplateCode(
    templateContent,
    allTranslatedWord,
    keysInUse,
    templateType,
    styleType
  );

  const scriptAST = generateAST(scriptContent, {
    sourceType: 'module',
    plugins: [
      '@babel/plugin-syntax-jsx',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-syntax-class-properties',
      ['@babel/plugin-syntax-decorators', { legacy: true }],
      '@babel/plugin-syntax-object-rest-spread',
      '@babel/plugin-syntax-async-generators',
      '@babel/plugin-syntax-do-expressions',
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-syntax-export-extensions',
      '@babel/plugin-syntax-function-bind',
      plugin,
    ],
  });

  // TODO: 根据是否有需要替换文案，决定是否重写源码
  // const { translateWordsNum } = outObj;

  let code = '';
  code = prettier.format(
    '<template lang='
    + templateType
    + '>\n'
    + templatecode
    + '\n</template>\n'
    + '<script>\n'
    + scriptAST.code
    + '\n</script>\n'
    + '<style lang='
    + styleType
    + '>\n'
    + styleContent
    + '\n</style>\n',

    // TODO: vue 文件的格式化选项抽出为配置
    { parser: 'vue', semi: false, singleQuote: true }
  ); // 注意空标签的处理

  return {
    // isRewritten: translateWordsNum !== 0,
    code: code,
    isRewritten: true,
  };
}

module.exports = translateVue;
