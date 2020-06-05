const fs = require('fs');
const path = require('path');
const defaultOptions = require('./reactOptions');
const log = require('./log');

const cwdPath = process.cwd();

module.exports = function mergeOptions(programOption, programParameter) {
  const options = defaultOptions;
  const configFileName = programOption.config || 'di18n.config.js';

  const configFilePath = path.join(cwdPath, configFileName);

  // 读取 di18n-ast.config.js 中设置的参数，然后并入 options
  if (fs.existsSync(configFilePath)) {
    let configurationFile = {};
    try {
      configurationFile = require(configFilePath);
    } catch (err) {
      log.error(`请检查 ${configFileName} 配置文件是否正确\n`);
    }

    Object.assign(options, configurationFile);
  } else {
    log.error(`配置文件 ${configFileName} 不存在\n`);
  }

  if (!Object.keys(programOption).length) {
    return options;
  }

  // 处理命令行参数
  programParameter.forEach(k => {
    const value = programOption[k];
    if (value) {
      if (k === 'exclude' && typeof value === 'string') {
        options[k] = value.split(',');
      } else {
        options[k] = value;
      }
    }
  });

  return options;
};
