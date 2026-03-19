/**
 * Doctor Check: npm Packages
 *
 * Validates:
 * 1. node_modules/ exists in project root (quick sanity check)
 * 2. (INS-4.12) .lmas-core/node_modules/ exists and contains all declared deps
 *
 * @module lmas-core/doctor/checks/npm-packages
 * @story INS-4.1, INS-4.12
 */

const path = require('path');
const fs = require('fs');

const name = 'npm-packages';

async function run(context) {
  const nodeModulesPath = path.join(context.projectRoot, 'node_modules');
  // Check 1: Project node_modules
  if (!fs.existsSync(nodeModulesPath)) {
    return {
      check: name,
      status: 'FAIL',
      message: 'node_modules not found',
      fixCommand: 'npm install',
    };
  }

  // Check 2 (INS-4.12): .lmas-core/node_modules/ completeness
  const lmasCoreDir = path.join(context.projectRoot, '.lmas-core');
  const lmasCorePackageJson = path.join(lmasCoreDir, 'package.json');
  const lmasCoreNodeModules = path.join(lmasCoreDir, 'node_modules');

  if (fs.existsSync(lmasCorePackageJson)) {
    if (!fs.existsSync(lmasCoreNodeModules)) {
      return {
        check: name,
        status: 'FAIL',
        message: 'node_modules present, but .lmas-core/node_modules/ missing',
        fixCommand: 'cd .lmas-core && npm install --production',
      };
    }

    // Verify all declared deps are installed
    try {
      const pkg = JSON.parse(fs.readFileSync(lmasCorePackageJson, 'utf8'));
      const deps = Object.keys(pkg.dependencies || {});
      const missing = [];

      for (const dep of deps) {
        const depPath = path.join(lmasCoreNodeModules, dep);
        if (!fs.existsSync(depPath)) {
          missing.push(dep);
        }
      }

      if (missing.length > 0) {
        return {
          check: name,
          status: 'FAIL',
          message: `node_modules present, but .lmas-core missing deps: ${missing.join(', ')}`,
          fixCommand: 'cd .lmas-core && npm install --production',
        };
      }
    } catch {
      // If we can't parse package.json, just check existence passed above
    }
  }

  return {
    check: name,
    status: 'PASS',
    message: 'node_modules present' + (fs.existsSync(lmasCoreNodeModules) ? ', .lmas-core deps complete' : ''),
    fixCommand: null,
  };
}

module.exports = { name, run };
