/******************************************************************************
 * Logging functions, log-level Enums, and LOG_LEVEL setting
 ******************************************************************************/
const WARN  = 1
const INFO  = 2
const DEBUG = 3
const ULTRA = 4

// SET LOG_LEVEL HERE - Change log level to control verbosity
const LOG_LEVEL = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : INFO;

export const logging = {
    warn: function(...args) {
        if (LOG_LEVEL >= WARN) {
            console.log(...args)
        }
    },
    info: function(...args) {
        if (LOG_LEVEL >= INFO) {
            console.log(...args)
        }
    },
    debug: function(...args) {
        if (LOG_LEVEL >= DEBUG) {
            console.log(...args)
        }
    },
    ultra: function(...args) {
        if (LOG_LEVEL >= ULTRA) {
            console.log(...args)
        }
    },
}

