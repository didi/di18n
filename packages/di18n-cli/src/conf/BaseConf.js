module.exports = class BaseConf {
  createService() {
    return Promise.resolve(true);
  }

  createConf() {
    throw new Error('`createConf` must be overrided');
  }

  updateConf() {
    throw new Error('`updateConf` must be overrided');
  }

  getConf() {
    throw new Error('`getConf` must be overrided');
  }

  publishConf() {
    return Promise.resolve(true);
  }
};
