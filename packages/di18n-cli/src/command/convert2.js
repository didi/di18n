const fs = require('fs');
const { transformReactIntlUniveralToDi18n } = require('di18n-core');
const mergeOptions = require('../utils/mergeOptions');
const log = require('../utils/log');

module.exports = function doConvert(programOption) {
  const options = mergeOptions(programOption, ['entry', 'exclude', 'locales']);

  if (!options.entry) {
    log.error('no entry is specified');
    process.exit(2);
  }

  if (Array.isArray(options.entry)) {
    if (!Array.isArray(options.output)) {
      log.error('output should be array too, since entry is array');
      process.exit(2);
    }

    if (options.output.length !== options.entry.length) {
      log.error('output length are not equal to entry length');
      process.exit(2);
    }
  }

  if (options.output) {
    [].concat(options.output).forEach(outputDir => {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
    });
  }

  return transformReactIntlUniveralToDi18n(options);
};
