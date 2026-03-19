/**
 * LMAS Directory Check
 *
 * Verifies .lmas/ directory structure and permissions.
 *
 * @module lmas-core/health-check/checks/project/lmas-directory
 * @version 1.0.0
 * @story HCS-2 - Health Check System Implementation
 */

const fs = require('fs').promises;
const path = require('path');
const { BaseCheck, CheckSeverity, CheckDomain } = require('../../base-check');

/**
 * Expected .lmas directory structure
 */
const EXPECTED_STRUCTURE = [
  { path: '.lmas', type: 'directory', required: false },
  { path: '.lmas/config.yaml', type: 'file', required: false },
  { path: '.lmas/reports', type: 'directory', required: false },
  { path: '.lmas/backups', type: 'directory', required: false },
];

/**
 * LMAS directory structure check
 *
 * @class LmasDirectoryCheck
 * @extends BaseCheck
 */
class LmasDirectoryCheck extends BaseCheck {
  constructor() {
    super({
      id: 'project.lmas-directory',
      name: 'LMAS Directory Structure',
      description: 'Verifies .lmas/ directory structure',
      domain: CheckDomain.PROJECT,
      severity: CheckSeverity.MEDIUM,
      timeout: 2000,
      cacheable: true,
      healingTier: 1, // Can auto-create directories
      tags: ['lmas', 'directory', 'structure'],
    });
  }

  /**
   * Execute the check
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Check result
   */
  async execute(context) {
    const projectRoot = context.projectRoot || process.cwd();
    const lmasPath = path.join(projectRoot, '.lmas');
    const issues = [];
    const found = [];

    // Check if .lmas exists at all
    try {
      const stats = await fs.stat(lmasPath);
      if (!stats.isDirectory()) {
        return this.fail('.lmas exists but is not a directory', {
          recommendation: 'Remove .lmas file and run health check again',
        });
      }
      found.push('.lmas');
    } catch {
      // .lmas doesn't exist - this is optional
      return this.pass('.lmas directory not present (optional)', {
        details: {
          message: '.lmas directory is created automatically when needed',
          healable: true,
        },
      });
    }

    // Check subdirectories
    for (const item of EXPECTED_STRUCTURE.filter((i) => i.path !== '.lmas')) {
      const fullPath = path.join(projectRoot, item.path);
      try {
        const stats = await fs.stat(fullPath);
        const typeMatch = item.type === 'directory' ? stats.isDirectory() : stats.isFile();
        if (typeMatch) {
          found.push(item.path);
        } else {
          issues.push(`${item.path} exists but is wrong type`);
        }
      } catch {
        if (item.required) {
          issues.push(`Missing: ${item.path}`);
        }
      }
    }

    // Check write permissions
    try {
      const testFile = path.join(lmasPath, '.write-test');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
    } catch {
      issues.push('.lmas directory is not writable');
    }

    if (issues.length > 0) {
      return this.warning(`LMAS directory has issues: ${issues.join(', ')}`, {
        recommendation: 'Run health check with --fix to create missing directories',
        healable: true,
        healingTier: 1,
        details: { issues, found },
      });
    }

    return this.pass('LMAS directory structure is valid', {
      details: { found },
    });
  }

  /**
   * Get healer for this check
   * @returns {Object} Healer configuration
   */
  getHealer() {
    return {
      name: 'create-lmas-directories',
      action: 'create-directories',
      successMessage: 'Created missing LMAS directories',
      fix: async (_result) => {
        const projectRoot = process.cwd();
        const dirs = ['.lmas', '.lmas/reports', '.lmas/backups', '.lmas/backups/health-check'];

        for (const dir of dirs) {
          const fullPath = path.join(projectRoot, dir);
          await fs.mkdir(fullPath, { recursive: true });
        }

        return { success: true, message: 'Created LMAS directories' };
      },
    };
  }
}

module.exports = LmasDirectoryCheck;
