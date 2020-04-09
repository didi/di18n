const path = require('path');
const mergeOptions = require('../utils/mergeOptions');
const log = require('../utils/log');

module.exports = async function publish(programOption, env = '') {
  const options = mergeOptions(programOption, ['locales']);

  let confService = null;
  if (options.localeConf.type === 'file') {
    const FileConf = require('../conf/FileConf');
    confService = new FileConf(options.locales);
  } else {
    const Conf = require(path.join(process.cwd(), options.localeConf.path));
    confService = new Conf(options.localeConf);
  }

  const publishTasks = options.supportedLocales.map(key => {
    return confService.publishConf(`${key}-${env}`);
  });

  const publishTaskResults = await Promise.all(publishTasks);
  log.success('[done] conf published');
  console.log(publishTaskResults);
};
