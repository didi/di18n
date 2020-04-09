const t = require('@babel/types');
const log = require('../utils/log');

const isChinese = function(text) {
  return /[\u4e00-\u9fa5]/.test(text);
};

/**
 * 替换为 intl.get('xxxxxxxx').d('基本信息')
 */
function makeReplace({ value, variableObj, id }) {
  let key = id;

  // 用于防止中文转码为 unicode
  const v = Object.assign(t.StringLiteral(value), {
    extra: {
      raw: `'${value}'`,
      rawValue: value,
    },
  });

  return t.CallExpression(
    t.MemberExpression(
      t.CallExpression(
        t.MemberExpression(t.Identifier('intl'), t.Identifier('get')),
        variableObj
          ? [typeof key === 'string' ? t.StringLiteral(key) : key, variableObj]
          : [typeof key === 'string' ? t.StringLiteral(key) : key]
      ),
      t.Identifier('d')
    ),
    [v]
  );
}

/**
 * 获取代码转换的插件
 * @param {object} zhData 中文文案资源
 * @param {object} outObj 传出的参数对象
 */
function getPlugin(zhData, outObj) {
  const cache = {};

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

  const plugin = function({ types: t }) {
    return {
      visitor: {
        ImportDeclaration(path) {
          const { node } = path;
          if (node.source.value === 'di18n-react') {
            outObj.hasReactIntlUniversal = true;
          }

          if (node.source.value === 'react-intl') {
            outObj.needRewrite = true;
            log.info('remove: injectIntl');
            path.remove();
          }
        },
        Decorator(path) {
          const { node } = path;
          if (node.expression.name === 'injectIntl') {
            outObj.needRewrite = true;
            log.info('remove: injectIntl decorator');
            path.remove();
          }
        },
        BinaryExpression(path) {
          const { node } = path;

          // 替换类似 this.props.intl.locale === 'en' 为 intl.options.currentLocale === 'en-US'
          if (
            node.operator === '==='
            && node.right.type === 'StringLiteral'
            && node.right.value === 'en'
            && node.left.type === 'MemberExpression'
            && node.left.property.name === 'locale'
          ) {
            outObj.needRewrite = true;
            log.info("replace intl.locale === 'en'");

            node.left = t.MemberExpression(
              t.MemberExpression(t.Identifier('intl'), t.Identifier('options')),
              t.Identifier('currentLocale')
            );
            node.right = t.StringLiteral('en-US');
          }
        },
        ObjectPattern(path) {
          const { node } = path;

          const parent = path.parent;
          if (!parent.init) {
            return;
          }

          if (
            (parent.init.type === 'Identifier'
              && parent.init.name === 'props')
            || (parent.init.type === 'MemberExpression'
              && parent.init.property.name === 'props')
          ) {
            // 处理掉 let { params, intl } = this.props; 中的 intl
            log.info('remove: this.props.intl');
            node.properties = node.properties.filter(
              p => !p.value || p.value.name !== 'intl'
            );
          }
        },
        JSXElement(path) {
          const { node } = path;
          const { openingElement } = node;
          if (openingElement.name.name === 'FormattedMessage') {
            outObj.needRewrite = true;

            const idNode = openingElement.attributes.find(
              atr => atr.name.name === 'id'
            );

            const id = idNode.value.value
              ? idNode.value.value
              : idNode.value.expression;

            const valuesNode = openingElement.attributes.find(
              atr => atr.name.name === 'values'
            );
            let callExpression;

            if (valuesNode) {
              callExpression = makeReplace({
                value: zhData[id] || 'TBD',
                id: id,
                variableObj: valuesNode.value.expression,
              });
            } else {
              callExpression = makeReplace({
                value: zhData[id] || 'TBD',
                id: id,
              });
            }

            if (path.parent.type === 'JSXExpressionContainer') {
              path.replaceWith(callExpression);
            } else if (path.parent.type === 'JSXElement') {
              path.replaceWith(t.JSXExpressionContainer(callExpression));
            } else {
              path.replaceWith(callExpression);
            }
          }
        },
        StringLiteral(path) {
          const { node } = path;
          const { value } = node;
          const key = value + node.start + node.end;
          if (isChinese(value) && !cache[key]) {
            if (path.parent.type === 'JSXAttribute') {
              path.replaceWith(handleChinese(value, key));
            }
          }
        },
        CallExpression(path) {
          const { node } = path;

          const handleFormatMessageMethod = () => {
            const id = node.arguments[0].properties.find(
              prop => prop.key.name === 'id'
            ).value.value;
            outObj.needRewrite = true;

            log.info(`replace: ${id}`);

            if (node.arguments.length === 1) {
              path.replaceWith(
                makeReplace({ value: zhData[id] || 'TBD', id: id })
              );
            } else {
              path.replaceWith(
                makeReplace({
                  value: zhData[id] || 'TBD',
                  id: id,
                  variableObj: node.arguments[1],
                })
              );
            }
          };

          if (node.callee.type === 'MemberExpression') {
            if (node.callee.property.name === 'formatMessage') {
              if (
                (node.callee.object.property
                  && node.callee.object.property.name === 'intl')
                || (node.callee.object.type === 'Identifier'
                  && node.callee.object.name === 'intl')
              ) {
                handleFormatMessageMethod();
              }
            }
          } else {
            if (node.callee.name === 'formatMessage') {
              handleFormatMessageMethod();
            } else if (node.callee.name === 'injectIntl') {
              outObj.needRewrite = true;
              path.replaceWith(node.arguments[0]);
            }
          }
        },
      },
    };
  };

  return plugin;
}

module.exports = getPlugin;
