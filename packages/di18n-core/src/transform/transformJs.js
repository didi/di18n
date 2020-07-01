const babel = require('@babel/core');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
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

  // 转换成行号
  const ignoreLines = [];
  for (const block of ignoreBlocks) {
    for (let i = block.start; i <= block.end; i++) {
      ignoreLines.push(i);
    }
  }

  return ignoreLines;
}

function makeVisitor({
  primaryRegx,
  i18nObject,
  i18nMethod,
  importCode,
  ignoreLines,
  ignoreMethods,
  ignoreComponents,
}, returns) {
  const { allTranslated, allUpdated, allUsedKeys } = returns;
  const existValues = Object.keys(allTranslated);
  const hacked = {};

  // XXX: [TRICKY] 防止中文转码为 unicode
  function hackValue(value, key) {
    if (key) hacked[key] = true;

    return Object.assign(t.StringLiteral(value), {
      extra: {
        raw: `'${value}'`,
        rawValue: value,
      },
    });
  }

  function shouldIgnore(node) {
    if (node.loc) {
      // node may not have loc
      return ignoreLines.includes(node.loc.start.line);
    }
    return false;
  }

  function isPrimary(str) {
    return primaryRegx.test(str);
  }

  // 去掉首尾空白字符，中间的连续空白字符替换成一个空格
  function formatWhitespace(str) {
    return str.trim().replace(/\s+/g, ' ');
  }

  function makeObjectExpression(obj) {
    if (Object.prototype.toString.call(obj) === '[object Object]') {
      const ObjectPropertyArr = [];
      Object.keys(obj).forEach(k => {
        ObjectPropertyArr.push(
          t.ObjectProperty(
            t.Identifier(k),
            obj[k].isAstNode ? obj[k].value : t.Identifier(obj[k])
          )
        );
      });
      return t.ObjectExpression(ObjectPropertyArr);
    }
    return null;
  }

  // 更新2个 `all*` 数组
  function updateLocaleInfo(key, value) {
    // 存在文案替换
    returns.hasTouch = true;

    if (!Array.isArray(allTranslated[value])) {
      // 如果该文字没有存在于已翻译列表
      allTranslated[value] = [key];
      existValues.push(key);
    } else if (allTranslated[value][0] === '') {
      // 只有带有 context key 的情况
      allTranslated[value][0] = key;
    }
    if (!allUsedKeys.includes(key)) {
      allUsedKeys.push(key);
    }
  }

  function makeReplace(value, variables) {
    value = formatWhitespace(value);

    // 直接使用主语言（比如中文）做 key
    const key = value;

    updateLocaleInfo(key, value);

    // 生成新节点
    const v = hackValue(value);
    const objExp = makeObjectExpression(variables);

    if (i18nObject) {
      return t.callExpression(
        t.memberExpression(
          t.identifier(i18nObject),
          t.identifier(i18nMethod)
        ),
        objExp ? [v, objExp] : [v]
      );
    }

    return t.callExpression(
      t.identifier(i18nMethod),
      objExp ? [v, objExp] : [v]
    );
  }

  return {
    ImportDeclaration(path) {
      // 已经导入过 di18n-react 或 di18n-vue 包
      if (importCode.includes(path.node.source.value)) {
        returns.hasImport = true;
      }
      path.skip();
    },

    TemplateLiteral(path) {
      const { node } = path;

      if (!shouldIgnore(node)) {
        const tempArr = [...node.quasis, ...node.expressions];
        tempArr.sort((a, b) => a.start - b.start);

        let value = '';
        const variable = {};
        let needReplace = false;
        let slotIndex = 0;

        tempArr.forEach(function(nd) {
          if (nd.type === 'TemplateElement') {
            value += nd.value.cooked;
            if (isPrimary(nd.value.cooked)) {
              needReplace = true;
            }
          } else if (nd.type === 'Identifier') {
            value += `{${nd.name}}`;
            variable[nd.name] = nd.name;
            needReplace = true;
          } else {
            // 例如 CallExpression 等
            const identifier = `slot${slotIndex++}`;
            value += `{${identifier}}`;
            variable[identifier] = { isAstNode: true, value: nd };
            needReplace = true;
          }
        });

        if (needReplace && value.trim()) {
          path.replaceWith(
            makeReplace(value, variable)
          );
        }
      }
      path.skip();
    },

    StringLiteral(path) {
      const { node } = path;
      const { value } = node;

      if (!shouldIgnore(node) && isPrimary(node.value)) {
        switch (path.parent.type) {
          case 'ObjectProperty':
          case 'AssignmentExpression':
            path.replaceWith(
              makeReplace(value)
            );
            break;
          case 'CallExpression':
            let v = value;

            if (allUpdated.hasOwnProperty(value)) {
              // 如果对应的中文已经在远端被修改，则自动更新代码
              v = allUpdated[value];
            }

            path.replaceWith(
              makeReplace(v)
            );
            break;
          case 'NewExpression':
            // XXX: 会出现吗?
            break;
          case 'JSXAttribute':
            if (ignoreComponents.includes(path.parentPath.parent.name.name)) {
              // 过滤掉配置中 ignoreComponents 中指定的组件
              const key = value + node.start + node.end;
              if (!hacked[key]) {
                path.replaceWith(
                  hackValue(value, key)
                );
              }
            } else {
              path.replaceWith(
                t.JSXExpressionContainer(
                  makeReplace(value)
                )
              );
            }
            break;
          default:
            path.replaceWith(
              makeReplace(value)
            );
            break;
        }

        path.skip();
      } else if (isPrimary(value)) {
        console.warn('ignore 1!!!!!!', value);
      }
    },

    CallExpression(path) {
      const { node } = path;

      if (shouldIgnore(node)) {
        path.skip();
        return;
      }

      if (node.callee.type === 'MemberExpression') {
        const { object, property } = node.callee;

        if (
          (object.name === i18nObject || object.type === 'ThisExpression')
          && property.name === i18nMethod
        ) {
          // 收集现有的 key
          const args = node.arguments;
          const hasContext = args[1] && typeof args[1].value === 'string';

          let key = args[0].value;
          let variable = null;

          if (hasContext) {
            // 附加上 context
            key += `{context, ${args[1].value}}`;
            variable = args[2];
          } else {
            variable = args[1];
          }

          if (allUpdated.hasOwnProperty(key)) {
            // 如果对应的中文已经在远端被修改，则自动更新代码
            path.replaceWith(
              makeReplace(allUpdated[key], variable)
            );
          } else {
            if (Array.isArray(node.arguments) && node.arguments.length > 0) {
              if (!allUsedKeys.includes(key)) {
                allUsedKeys.push(key);
              }

              const { value } = node.arguments[0];

              if (!existValues.includes(value)) {
                if (hasContext) {
                  allTranslated[value] = ['', key];
                } else {
                  allTranslated[value] = [key];
                }
                existValues.push(value);
              } else if (!allTranslated[value].includes(key)) {
                allTranslated[value].push(key);
              }
            }
          }

          path.skip();
          return;
        }

        // 处理 ignoreMethods
        let parentNode = '';
        if (node.callee.object.name) {
          parentNode = node.callee.object.name;
        } else if (node.callee.object.property) {
          // 处理忽略类似 Sdk.TaoTie.trackUserClickEvent 方法情况
          parentNode = node.callee.object.property.name;
        }

        const callExpression = `${parentNode}.${node.callee.property.name}`;

        if (ignoreMethods.includes(callExpression)) {
          path.skip();
          return;
        }
      }

      // 跳过 ignoreMethods 中配置的被忽略的方法名
      if (node.callee.type === 'Identifier') {
        if (ignoreMethods.includes(node.callee.name)) {
          path.skip();
        }
      }
    },

    JSXElement(path) {
      const { node } = path;

      if (!node.ignore && !shouldIgnore(node)) {
        const { openingElement } = node;
        if (openingElement.name.name === 'Di18nTrans') {
          const keyAtr = openingElement.attributes.find(atr => atr.name.name === 'i18nKey');
          if (!keyAtr) return;

          const key = keyAtr.value.value;

          // Di18nTrans 的 key 和 value 肯定不一样
          // 这里从 allUpdated 中移除 Di18nTrans 对应的 key
          delete allUpdated[key];

          const value = node.children.reduce((prev, cur, index) => {
            if (cur.type === 'JSXText') {
              // 内部的文案加上标记，不再检测
              cur.ignore = true;
              return prev + formatWhitespace(cur.value);
            }

            if (cur.type === 'JSXElement') {
              // 内部的文案加上标记，不再检测
              cur.children[0].ignore = true;
              return prev + formatWhitespace(`<${index}>${cur.children[0].value}</${index}>`);
            }

            console.error(`${cur.type} node are not supported in Di18nTrans`);
            return '';
          }, '');

          updateLocaleInfo(key, value);
        }
        // 不能完全忽视该节点，内部的 JSX 属性照样需要检测
        // path.skip();
      }
    },

    JSXText(path) {
      const { node } = path;

      if (!node.ignore && !shouldIgnore(node) && isPrimary(node.value)) {
        // 将中文替换为 JSX 表达式
        path.replaceWith(
          t.JSXExpressionContainer(
            makeReplace(node.value)
          )
        );
      }

      path.skip();
    },
  };
}

module.exports = function transformJs(source, localeInfo = {}, options = {}) {
  const {
    allTranslated = {},
    allUpdated = {},
    allUsedKeys = [],
  } = localeInfo;

  const {
    primaryRegx = /[\u4e00-\u9fa5]/,
    i18nObject = 'intl',
    i18nMethod = 't',
    importCode = "import { intl } from 'di18n-react';",
    babelPresets = [],
    babelPlugins = [],
    ignoreComponents = [],
    ignoreMethods = [],
  } = options;

  const transformOptions = {
    sourceType: 'module',
    ast: true,
    presets: babelPresets,
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
      ...babelPlugins,
    ],
  };

  const opts = {
    primaryRegx,
    i18nObject,
    i18nMethod,
    importCode,
    ignoreLines: [],
    ignoreMethods,
    ignoreComponents,
  };

  const r = {
    allTranslated,
    allUpdated,
    allUsedKeys,
    hasImport: false,
    hasTouch: false,
  };

  const ast = babel.parseSync(source, transformOptions);
  opts.ignoreLines = getIgnoreLines(ast);
  const visitor = makeVisitor(opts, r);

  traverse(ast, visitor);

  let { code } = generate(ast, { retainLines: true }, source);

  if (!r.hasTouch) {
    code = source;
  } else if (!r.hasImport && importCode) {
    code = `${importCode}\n${code}`;
  }

  return { source: code, hasTouch: r.hasTouch };
};
