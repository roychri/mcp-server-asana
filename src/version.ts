/** @internal - This file is auto-generated */
export const VERSION = process.env.NODE_ENV === 'development'
  ? require('../package.json').version  // Development: read from package.json
  : __VERSION__;                        // Production: replaced at build time
