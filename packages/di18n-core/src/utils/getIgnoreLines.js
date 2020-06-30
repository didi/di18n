module.exports = function getIgnoreLines(tpl) {
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
