const { transformReactIntlToReactIntlUniversal } = require('di18n-core');
const mergeOptions = require('../utils/mergeOptions');
const log = require('../utils/log');

module.exports = function doConvertToReactIntlUniversal(programOption) {
  const options = mergeOptions(programOption, ['entry', 'exclude', 'locales']);

  if (!options.entry) {
    log.error('\n · 使用 -e [path] 或 --entry [path] 命令增加待转换的源码目录');
    log.error(" · 或在配置文件中设置 'entry' 字段\n");
    process.exit(2);
  }

  transformReactIntlToReactIntlUniversal(options);
};
