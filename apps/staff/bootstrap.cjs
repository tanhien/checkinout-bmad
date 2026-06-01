// Bootstrap: load tsx for .ts support but restore .js handler so Next.js internals work
const Module = require('module')

// Save Node.js's original .js handler (before tsx replaces it)
const originalJsHandler = Module._extensions['.js']

// Register tsx CJS hooks (.ts transformation)
require('tsx/cjs')

// Restore original .js handler — prevents tsx from transforming Next.js compiled .js files
Module._extensions['.js'] = originalJsHandler

// Now load the TypeScript server entry point
require('./server.ts')
