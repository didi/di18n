const t = require('@babel/types');

const replaceLineBreak = function(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/\n/g, ' ');
};

/**
 * 获取代码转换的插件
 */
function getPlugin(outObj, allConverted, intlAlias = 'intl') {
  function makeReplace({ orignKey, value, variableObj }) {
    outObj.translateWordsNum++;

    const value2 = replaceLineBreak(value);

    // 用于防止中文转码为 unicode
    const v = Object.assign(t.StringLiteral(value2), {
      extra: {
        raw: `'${value2}'`,
        rawValue: value2,
      },
    });

    allConverted[orignKey] = value;

    return t.CallExpression(
      t.MemberExpression(t.Identifier(intlAlias), t.Identifier('t')),
      variableObj ? [v, variableObj] : [v]
    );
  }

  const plugin = function() {
    return {
      visitor: {
        CallExpression(path) {
          const { node } = path;

          if (node.callee.type === 'MemberExpression') {
            if (path.node.callee.object.name === intlAlias && path.node.callee.property.name === 'get') {
              const args = path.node.arguments;

              const orignKey = args[0].value;
              const variableObj = args[1] ? args[1] : null;

              const value = path.parentPath.parent.arguments[0].value;

              path.parentPath.parentPath.replaceWith(makeReplace({ orignKey, value, variableObj }));
            }
          }
        },
      },
    };
  };

  return plugin;
}

module.exports = getPlugin;
