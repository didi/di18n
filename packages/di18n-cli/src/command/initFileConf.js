const glob = require('glob');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const prettier = require('prettier');
const FileConf = require('../conf/FileConf');
const reactOptions = require('../utils/reactOptions');
const vueOptions = require('../utils/vueOptions');
const log = require('../utils/log');

function getLocaleFiles({ path, exclude }) {
  return glob.sync(`${path}/**/*.json`, {
    ignore: (exclude || []).map(e => `${path}/${e}`),
  });
}

async function doInquire() {
  // 1. whether overwrite?
  let configExist = true;
  try {
    fs.accessSync('./di18n.config.js');
  } catch (e) {
    configExist = false;
  }

  if (configExist) {
    const ans = await inquirer.prompt([
      {
        name: 'overwrite',
        type: 'confirm',
        message: '配置文件 di18n.config.js 已存在，是否覆盖？',
      },
    ]);

    if (!ans.overwrite) process.exit(0);
  }

  // 2. first i18n?
  let ans = await inquirer.prompt([
    {
      name: 'firstI18n',
      type: 'confirm',
      message: '是否初次国际化？',
    },
    {
      name: 'localePath',
      type: 'input',
      message: '请输入现有国际化资源路径：',
      when(answers) {
        return !answers.firstI18n;
      },
    },
  ]);

  return ans;
}

module.exports = async function initFileConf(isVue) {
  const answers = await doInquire();
  const { localePath = 'locales', firstI18n } = answers;

  const defaultOptions = isVue ? vueOptions : reactOptions;
  const options = {
    ...defaultOptions,
    localeConf: { type: 'file', folder: localePath },
  };

  // 配置信息写入文件
  fs.writeFileSync(
    './di18n.config.js',
    prettier.format(
      'module.exports = ' + JSON.stringify(options), {
        parser: 'babel',
        singleQuote: true,
        trailingComma: 'es5',
      }
    ),
    'utf8'
  );

  let createTasks = [];
  const confService = new FileConf(options.localeConf.folder);

  if (!firstI18n) {
    // 非首次国际化，本地代码中已有国际化资源
    const locales = getLocaleFiles({ path: localePath });

    // 读取国际化资源
    const data = locales.map(element => {
      // TODO: 支持国际化资源为 js 文件的情况，目前只支持为 json 文件。
      const json = fs.readFileSync(element, {
        encoding: 'utf-8',
      });

      // 使用现有文件名为语言 key
      const key = path.parse(element).name;

      return {
        key,
        value: JSON.parse(json),
        confName: key,
      };
    });

    createTasks = data.map(({ confName, value, key }) => {
      let commentValue = {};
      if (key !== options.primaryLocale) {
        commentValue = data.find(d => d.key === options.primaryLocale).value;
      }
      return confService.createConf(confName, value, commentValue, key);
    });
  } else {
    // 首次国际化，只需要创建配置
    createTasks = options.supportedLocales.map(key => {
      const value = { TBD: 'TBD' }; // 创建配置时，必须要有一个 k/V
      const confName = key; // 初始化时，先创建测试环境的配置
      return confService.createConf(confName, value, {}, key);
    });
  }

  const createTaskResults = await Promise.all(createTasks);
  log.success('[done] conf created');
  console.log(createTaskResults);

  // 将已有国际化资源的配置发布
  if (!firstI18n) {
    const publishTasks = options.supportedLocales.map(key => {
      return confService.publishConf(`${key}-test`);
    });

    const publishTaskResults = await Promise.all(publishTasks);
    log.success('[done] conf published');
    console.log(publishTaskResults);
  }
};
