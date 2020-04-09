const fs = require('fs');
const path = require('path');
const BaseConf = require('./BaseConf');
const log = require('../utils/log');

const cwdPath = process.cwd();

module.exports = class FileConf extends BaseConf {
  constructor(folder) {
    super();
    this.localesDir = folder;
  }

  /**
   * 创建一个服务
   */
  createService() {
    log.info('No need to create service in FileConf');
    return super.createService();
  }

  /**
   * 创建一个配置
   * @param {string} confName  配置名称
   * @param {object} values    KV值
   * @param {object} refValues 参数备注
   * @param {string} key       locales标识
   */
  createConf(confName, values, refValues, key) {
    const folder = (
      this.localesDir.startsWith('/')
        ? this.localesDir
        : path.join(cwdPath, this.localesDir)
    );

    try {
      fs.accessSync(folder);
    } catch (e) {
      fs.mkdirSync(folder);
    }

    const configFilePath = path.join(folder, `${key}.json`);
    return new Promise((resolve, reject) => {
      fs.writeFile(configFilePath, JSON.stringify(values, null, 2), err => {
        if (err) {
          reject(err);
        } else {
          resolve(configFilePath);
        }
      });
    });
  }

  /**
   * 更新一个配置
   * @param {string} confName  配置名称
   * @param {object} values    KV值
   * @param {object} refValues 参数备注
   * @param {string} key       locales标识
   */
  updateConf(confName, values, refValues, key) {
    const configFilePath = path.join(cwdPath, this.localesDir, `${key}.json`);
    return new Promise(resolve => {
      fs.writeFile(configFilePath, JSON.stringify(values, null, 2), err => {
        if (err) {
          resolve({
            code: -1,
            message: err.message,
          });
        } else {
          resolve({
            code: 0,
            data: configFilePath,
          });
        }
      });
    });
  }

  /**
   * 获取配置值
   * @param {string} _  配置名称
   * @param {string} key  key
   */
  getConf(confName, key) {
    const configFilePath = path.join(cwdPath, this.localesDir, `${key}.json`);
    return new Promise((resolve, reject) => {
      if (fs.existsSync(configFilePath)) {
        let data = {};
        try {
          const content = fs.readFileSync(configFilePath);
          data = content.length > 0 ? JSON.parse(content) : {};
          resolve({
            code: 0,
            data: Object.keys(data).map(k => ({
              key: k,
              value: data[k],
            })),
          });
        } catch (err) {
          reject(new Error(`请检查 ${configFilePath} 资源文件 JSON 格式是否正确`));
        }
      } else {
        reject(new Error(`资源文件 ${configFilePath} 不存在`));
      }
    });
  }

  /**
   * 发布指定的配置
   */
  publishConf() {
    log.info('No need to publish in FileConf');
    return super.publishConf();
  }
};
