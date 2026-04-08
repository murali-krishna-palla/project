const logger = {
  info: (msg, data = '') => {
    console.log(`[INFO] ${msg}`, data);
  },
  error: (msg, err = '') => {
    console.error(`[ERROR] ${msg}`, err);
  },
  warn: (msg, data = '') => {
    console.warn(`[WARN] ${msg}`, data);
  },
  debug: (msg, data = '') => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${msg}`, data);
    }
  }
};

module.exports = logger;
