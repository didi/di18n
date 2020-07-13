const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { transformZeroToDi18n } = require('di18n-core');
const mergeOptions = require('../utils/mergeOptions');
const isChinese = require('../utils/isChinese');
const log = require('../utils/log');

function getSourceFiles({ entry, exclude }) {
  return glob.sync(`${entry}/**/*.{js,ts,tsx,jsx,vue}`, {
    ignore: exclude || [],
  });
}

/**
 * 同步一个非中文语言的配置
 */
async function syncOneNonChineseLocalesConf(
  key,
  option,
  chineseLocales,
  updatedTranslatedWord,
  publish,
  confService
) {
  const confName = key;
  const { disableAutoTranslate, translator } = option;

  const translate = (
    translator
      ? require(path.join(process.cwd(), translator))
      : require('../translate/google')
  );

  log.warning(`start to update conf ${confName}`);

  const res = await confService.getConf(confName, key);

  if (res.code !== 0) {
    log.error(`! failed to read apollo conf, ${res.message}`);
    return null;
  }

  const allKeys = Object.keys(chineseLocales);
  let mergedLocales = {};

  res.data.forEach(item => {
    if (updatedTranslatedWord.hasOwnProperty(item.key)) {
      mergedLocales[updatedTranslatedWord[item.key]] = item.value;
    } else if (allKeys.indexOf(item.key) >= 0) {
      mergedLocales[item.key] = item.value;
    }
  });

  mergedLocales = { ...chineseLocales, ...mergedLocales };

  const translateTasks = [];

  Object.keys(mergedLocales).forEach(k => {
    const text = mergedLocales[k];
    let targetLang = key.split(/_|-/)[0];
    if (isChinese(text)) {
      if (disableAutoTranslate) {
        mergedLocales[k] = text;
      } else {
        translateTasks.push(
          translate(text, targetLang)
            .then(res => {
              mergedLocales[k] = res.text;
            })
            .catch(err => {
              log.warning(`[AutoTranslate]: ${err.message}`);
              mergedLocales[k] = text;
            })
        );
      }
    }
  });

  // 控制并发数
  const concurrenceCount = 3;
  while (translateTasks.length > 0) {
    const tasks = translateTasks.splice(0, concurrenceCount);
    await Promise.all(tasks);
  }

  const updateConfRes = await confService.updateConf(
    confName,
    mergedLocales,
    chineseLocales,
    key
  );
  if (updateConfRes.code !== 0) {
    log.error(`update conf ${confName} fail, ${res.message}`);
    return [];
  }

  log.success(`updated conf ${confName}`);

  if (publish) {
    log.warning(`start to publish conf ${confName}`);
    const publishRes = await confService.publishConf(confName);
    if (publishRes.code === 0) {
      log.success(`published conf ${confName}`);
    } else {
      log.error(`publish conf ${confName} failed, ${publishRes.message}`);
    }
  } else {
    log.warning(`${confName} is updated but unpublished!`);
  }

  return {
    key,
    locales: mergedLocales,
  };
}

/**
 * 同步更新非中文配置
 * @param {object}  chineseLocales  中文资源
 * @param {object} updatedTranslatedWord 在远端做过中文文案修改的 key/value
 * @param {object}  option          参数
 * @param {boolean} publish         更新后是否立即发布配置
 */
async function syncNonChineseLocalesConf(
  chineseLocales,
  updatedTranslatedWord,
  option,
  publish,
  confService
) {
  const { primaryLocale, supportedLocales } = option;

  const syncTasks = supportedLocales
    .filter(key => key !== primaryLocale)
    .map(key => syncOneNonChineseLocalesConf(
      key,
      option,
      chineseLocales,
      updatedTranslatedWord,
      publish,
      confService
    ));

  const nonChineseLocales = await Promise.all(syncTasks);

  return nonChineseLocales;
}


/**
 * 收集源码中的中文字符
 * @param {object}  option  命令行或者配置文件中传入的参数信息
 * @param {boolean} publish 同步后，是否立即发布新的配置
 */
async function collectChineseWords(option, publish, confService) {
  const { entry, output, exclude } = option;

  if (!Array.isArray(entry) && typeof entry !== 'string') {
    log.error('entry must be a string or array');
    process.exit(2);
  }

  let zhData = {};
  const allTranslatedWord = {};
  const updatedTranslatedWord = {}; // 在远端做过中文文案修改的 key/value
  const keysInUse = [];

  const zhConfName = 'zh-CN';

  const res = await confService.getConf(zhConfName, 'zh-CN');

  if (res.code !== 0) {
    log.error(`failed to read apollo conf, ${res.message}`);
    process.exit(2);
  }

  res.data.forEach(item => {
    zhData[item.key] = item.value;
  });

  Object.keys(zhData).forEach(k => {
    const chineseValue = zhData[k];
    if (chineseValue.trim() !== k.replace(/\{context,\s*\S+\}$/, '')) {
      updatedTranslatedWord[k] = chineseValue;
    } else {
      if (Array.isArray(allTranslatedWord[chineseValue])) {
        allTranslatedWord[chineseValue].push(k);
      } else {
        allTranslatedWord[chineseValue] = [k];
      }
    }
  });

  const outputs = output ? [].concat(output) : [];
  const targetFiles = [].concat(entry).reduce((prev, cur, index) => {
    const files = getSourceFiles({ entry: cur, exclude }).map(file => ({
      filePath: file,
      currentEntry: cur,
      currentOutput: outputs[index],
      ext: path.extname(file),
    }));
    return prev.concat(files);
  }, []);

  targetFiles.forEach(codeFileInfo => {
    transformZeroToDi18n(
      codeFileInfo,
      allTranslatedWord,
      updatedTranslatedWord,
      keysInUse,
      option
    );
    log.success(`done: ${codeFileInfo.filePath}`);
  });

  const localeResouce = {};
  const unusedKeys = [];
  Object.keys(allTranslatedWord).forEach(k => {
    allTranslatedWord[k].forEach(key => {
      if (keysInUse.includes(key)) {
        localeResouce[key] = k;
      } else {
        unusedKeys.push(key);
      }
    });
  });

  if (unusedKeys.length > 0) {
    log.info('the following keys are unused and will be removed:');
    log.info(unusedKeys);
  }

  const allTranslatedWordKeysCount = Object.keys(allTranslatedWord).reduce(
    (prev, cur) => prev + allTranslatedWord[cur].length,
    0
  );
  const allLocalesKeyCount = Object.keys(localeResouce).length;
  const allTranstedInUseCount = allTranslatedWordKeysCount - unusedKeys.length;

  log.info(`keys in use count: ${allTranstedInUseCount}`);
  log.info(`locales in use count: ${allLocalesKeyCount}`);

  if (allTranstedInUseCount !== allLocalesKeyCount) {
    log.error('ATTENTION：keys and locales are not match');
  }

  log.info(`start to update conf ${zhConfName}`);

  // 更新配置
  const updateConfRes = await confService.updateConf(
    zhConfName,
    localeResouce,
    {},
    'zh-CN'
  );

  if (updateConfRes.code !== 0) {
    log.error(`update conf ${zhConfName} failed, ${updateConfRes.message}`);
    return null;
  }

  log.success(`updated conf ${zhConfName}`);

  const unChineseLocales = await syncNonChineseLocalesConf(
    localeResouce,
    updatedTranslatedWord,
    option,
    publish,
    confService
  );

  // XXX: 英文 publish 也放到这里
  if (publish) {
    log.warning(`start to publish conf ${zhConfName}`);
    const publishRes = await confService.publishConf(zhConfName);
    if (publishRes.code === 0) {
      log.success(`published conf ${zhConfName}`);
    } else {
      log.error(`publish conf ${zhConfName} failed, ${publishRes.message}`);
    }
  } else {
    log.warning(`${zhConfName} is synced, but unpublihsed !!`);
  }

  return unChineseLocales.concat({
    key: 'zh-CN',
    locales: localeResouce,
  });
}

module.exports = function doCollectChineseWords(
  programOption,
  publish = false
) {
  const options = mergeOptions(programOption, ['entry', 'exclude', 'locales']);

  let confService = null;
  if (options.localeConf.type === 'file') {
    const FileConf = require('../conf/FileConf');
    confService = new FileConf(options.localeConf.folder);
  } else {
    const Conf = require(options.localeConf.path);
    confService = new Conf(options.localeConf);
  }

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

  return collectChineseWords(options, publish, confService);
};
