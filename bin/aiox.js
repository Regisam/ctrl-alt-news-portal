#!/usr/bin/env node
/**
 * AIOX CLI Executable
 *
 * Entry point for running aiox commands from the command line.
 * This wrapper adapts the CommonJS CLI to work with ES modules.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { run } = require('../.aiox-core/cli');

run(process.argv);
