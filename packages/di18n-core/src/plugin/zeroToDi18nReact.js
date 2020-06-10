const t = require('@babel/types');

const isChinese = function(text) {
  return /[\u4e00-\u9fa5]/.test(text);
};

const replaceLineBreak = function(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/\n/g, ' ');
};

class ASTNode {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

function setObjectExpression(obj) {
  if (Object.prototype.toString.call(obj) === '[object Object]') {
    const ObjectPropertyArr = [];
    for (const o in obj) {
      if (obj[o] instanceof ASTNode) {
        ObjectPropertyArr.push(t.ObjectProperty(t.Identifier(o), obj[o].value));
      } else {
        ObjectPropertyArr.push(
          t.ObjectProperty(t.Identifier(o), t.Identifier(obj[o]))
        );
      }
    }
    return t.ObjectExpression(ObjectPropertyArr);
  }
  return null;
}

function getPlugin(
  allTranslateWord,
  updatedTranslatedWord,
  outObj,
  intlAlias = 'intl',
  tMethod = 't',
  ignoreComponents = [],
  ignoreMethods = [],
  ingoreLines = []
) {
  const cache = {};
  const existingChineseStrings = Object.keys(allTranslateWord);

  // 防止中文转码为 unicode
  function handleChinese(value, key) {
    cache[key] = true;
    return Object.assign(t.StringLiteral(value), {
      extra: {
        raw: `'${value}'`,
        rawValue: value,
      },
    });
  }

  function makeReplace({ value, variableObj }) {
    outObj.translateWordsNum++;

    // 直接使用中文字符作为 key
    let key = value;

    // 如果该文字没有存在于已翻译列表
    if (!Array.isArray(allTranslateWord[value])) {
      allTranslateWord[value] = [key];
      existingChineseStrings.push(value);
    } else if (allTranslateWord[value][0] === '') {
      // 只有带有 context key 的情况
      allTranslateWord[value][0] = key;
    }

    let value2 = replaceLineBreak(value);
    if (!outObj.keysInUse.includes(key)) {
      outObj.keysInUse.push(key);
    }

    // 用于防止中文转码为 unicode
    const v = Object.assign(t.StringLiteral(value2), {
      extra: {
        raw: `'${value2}'`,
        rawValue: value2,
      },
    });

    if (intlAlias) {
      return t.CallExpression(
        t.MemberExpression(t.Identifier(intlAlias), t.Identifier(tMethod)),
        setObjectExpression(variableObj)
          ? [v, setObjectExpression(variableObj)]
          : [v]
      );
    }

    return t.CallExpression(
      t.Identifier(tMethod),
      setObjectExpression(variableObj)
        ? [v, setObjectExpression(variableObj)]
        : [v]
    );
  }

  function handleTransComponent({ key, value }) {
    outObj.translateWordsNum++;

    // 如果该文字没有存在于已翻译列表
    if (!Array.isArray(allTranslateWord[value])) {
      allTranslateWord[value] = [key];
      existingChineseStrings.push(value);
    } else if (allTranslateWord[value][0] === '') {
      // 只有带有 context key 的情况
      allTranslateWord[value][0] = key;
    }

    if (!outObj.keysInUse.includes(key)) {
      outObj.keysInUse.push(key);
    }
  }

  function ignoreNode(node, ingoreLines) {
    if (node.loc) {
      // XXX: node may not have loc, why?
      return ingoreLines.includes(node.loc.start.line);
    }
    return false;
  }

  const ignoreIdentifiers = ignoreMethods.filter(m => !m.includes('.'));
  const ignoreMemberExpressions = ignoreMethods.filter(m => m.includes('.'));

  return {
    ImportDeclaration(path) {
      const { node } = path;
      if (
        ['di18n-react'].indexOf(node.source.value) >= 0
        || ['di18n-vue'].indexOf(node.source.value) >= 0
      ) {
        outObj.hasReactIntlUniversal = true;
      }
      path.skip();
    },

    JSXText(path) {
      const { node } = path;

      if (
        !node.ignore
        && !ignoreNode(node, ingoreLines)
        && isChinese(node.value)
      ) {
        // 将中文替换为 JSX 表达式
        path.replaceWith(
          t.JSXExpressionContainer(
            makeReplace({
              value: node.value.trim().replace(/\n\s+/g, '\n'),
            })
          )
        );
      }
      path.skip();
    },

    CallExpression(path) {
      // 跳过 intl.t() 格式
      if (path.node.callee.type === 'MemberExpression') {
        if (
          (path.node.callee.object.name === intlAlias || path.node.callee.object.type === 'ThisExpression')
          && path.node.callee.property.name === tMethod
        ) {
          // 收集现有的 key
          const args = path.node.arguments;
          const hasContext = args[1] && typeof args[1].value === 'string';

          let key = args[0].value;
          let variableObj = null;

          if (hasContext) {
            // 附加上 context
            key += `{context, ${args[1].value}}`;
            variableObj = args[2];
          } else {
            variableObj = args[1];
          }

          if (!outObj.keysInUse.includes(key)) {
            outObj.keysInUse.push(key);
          }

          if (updatedTranslatedWord.hasOwnProperty(key)) {
            // 如果对应的中文已经在远端被修改，则自动更新代码
            path.replaceWith(
              makeReplace({
                value: updatedTranslatedWord[key],
                variableObj,
              })
            );
          } else {
            if (
              Array.isArray(path.node.arguments)
              && path.node.arguments.length > 0
            ) {
              const value = path.node.arguments[0].value;
              if (!existingChineseStrings.includes(value)) {
                if (hasContext) {
                  allTranslateWord[value] = ['', key];
                } else {
                  allTranslateWord[value] = [key];
                }
                existingChineseStrings.push(value);
              } else if (!allTranslateWord[value].includes(key)) {
                allTranslateWord[value].push(key);
              }
            }
            path.skip();
          }
        } else {
          let parentNode = '';
          if (path.node.callee.object.name) {
            parentNode = path.node.callee.object.name;
          } else if (path.node.callee.object.property) {
            // 处理忽略类似 Sdk.TaoTie.trackUserClickEvent 方法情况
            parentNode = path.node.callee.object.property.name;
          }
          const callExpression = `${parentNode}.${path.node.callee.property.name}`;
          if (ignoreMemberExpressions.includes(callExpression)) {
            path.skip();
          }
        }
      }

      // 跳过 ignoreMethods 中配置的被忽略的方法名
      if (path.node.callee.type === 'Identifier') {
        if (ignoreIdentifiers.includes(path.node.callee.name)) {
          path.skip();
        }
      }
    },

    StringLiteral(path) {
      const { node } = path;
      const { value } = node;
      if (!ignoreNode(node, ingoreLines) && isChinese(value)) {
        const key = value + node.start + node.end;
        if (path.parent.type === 'JSXAttribute') {
          // 过滤掉配置中 ignoreComponents 中指定的组件
          if (ignoreComponents.includes(path.parentPath.parent.name.name)) {
            if (!cache[key]) {
              path.replaceWith(handleChinese(value, key));
            }
          } else {
            path.replaceWith(
              t.JSXExpressionContainer(
                makeReplace({
                  value: value.trim(),
                })
              )
            );
          }
        } else if (path.parent.type === 'ObjectProperty') {
          path.replaceWith(
            makeReplace({
              value: value.trim(),
            })
          );
        } else if (path.parent.type === 'AssignmentExpression') {
          path.replaceWith(
            makeReplace({
              value: value.trim(),
            })
          );
        } else if (path.parent.type === 'CallExpression') {
          path.replaceWith(
            makeReplace({
              value: value.trim(),
            })
          );
        } else if (path.parent.type === 'NewExpression') {
          if (path.parent.callee.name === 'RegExp') {
            path.skip();
          }
        } else {
          path.replaceWith(
            makeReplace({
              value: value.trim(),
            })
          );
        }
        path.skip();
      } else {
        console.warn('ignore 1!!!!!!', value);
      }
    },

    TemplateLiteral(path) {
      if (
        ignoreNode(path.node, ingoreLines)
        || path.node.quasis.every(word => !isChinese(word.value.cooked))
      ) {
        path.skip();
        return;
      }

      const tempArr = []
        .concat(path.node.quasis, path.node.expressions)
        .sort(function(a, b) {
          return a.start - b.start;
        });
      let isreplace = false;
      let v = '';
      let slotIndex = 0;
      const variable = {};
      tempArr.forEach(function(t) {
        if (t.type === 'TemplateElement') {
          v += `${replaceLineBreak(t.value.cooked)}`;
          if (isChinese(t.value.cooked)) {
            isreplace = true;
          }
        } else if (t.type === 'Identifier') {
          variable[t.name] = t.name;
          v += `{${t.name}}`;
          isreplace = true;
        } else {
          let identifier = `slot${slotIndex}`;
          v += `{${identifier}}`;
          variable[identifier] = new ASTNode('BinaryExpression', t);
          isreplace = true;
          slotIndex++;
        }
      });
      if (!isreplace) {
        path.skip();
        return;
      }
      if (v.trim() === '') {
        path.skip();
        return;
      }
      path.replaceWith(
        makeReplace({
          value: v,
          variableObj: variable,
        })
      );
      path.skip();
    },

    JSXElement(path) {
      const node = path.node.openingElement;
      if (node.name.name === 'Di18nTrans') {
        const keyAtr = node.attributes.find(atr => atr.name.name === 'i18nKey');
        if (keyAtr) {
          const key = keyAtr.value.value;

          // Di18nTrans 的 key 和 value 肯定不一样
          // 这里从 updatedTranslatedWord 中移除 Di18nTrans 对应的 key
          delete updatedTranslatedWord[key];

          const value = path.node.children.reduce((prev, cur, index) => {
            if (cur.type === 'JSXText') {
              // 内部的文案加上标签，不再检测
              cur.ignore = true;
              return prev + replaceLineBreak(cur.value).trim();
            }

            if (cur.type === 'JSXElement') {
              // 内部的文案加上标签，不再检测
              cur.children[0].ignore = true;
              return (
                prev + replaceLineBreak(
                  `<${index}>${cur.children[0].value.trim()}</${index}>`
                ).trim()
              );
            }

            console.error(`${cur.type} node are not supported in Di18nTrans`);

            return '';
          }, '');

          handleTransComponent({ key, value });
        }
        // 不能完全忽视该节点，内部的 JSX 属性照样需要检测
        // path.skip();
      }
    },
  };
}

module.exports = getPlugin;
