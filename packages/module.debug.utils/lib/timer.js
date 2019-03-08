'use strict';

module.exports = {
  start: () => process.hrtime(),
  end: (timer, {
    factor = 1,
    suffix = 'ms',
    skipLog = false
  } = {}) => {
    const end = process.hrtime(timer);
    const time = (end[0] * 1000 + end[1] / 1000000) / factor;

    if (!skipLog) {
      // required - debug util
      // eslint-disable-next-line no-console
      console.log(`TIME_TAKEN: ${time}${suffix}`);
    }

    return time;
  }
};