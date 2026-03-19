// File: common/utils/status-mapper.js

/**
 * Status Mapper - Bidirectional status mapping between LMAS and ClickUp
 *
 * This module provides utilities for:
 * - Mapping LMAS story statuses to ClickUp custom field values
 * - Mapping ClickUp story-status values back to LMAS statuses
 * - Handling ClickUp-specific statuses (e.g., "Ready for Dev")
 *
 * CRITICAL: Stories use ClickUp custom field "story-status", NOT native status.
 * Epics use the native ClickUp status field (Planning, In Progress, Done).
 */

const STATUS_MAPPING = {
  LMAS_TO_CLICKUP: {
    'Draft': 'Draft',
    'Ready for Review': 'Ready for Review',
    'Review': 'Review',
    'In Progress': 'In Progress',
    'Done': 'Done',
    'Blocked': 'Blocked',
  },
  CLICKUP_TO_LMAS: {
    'Draft': 'Draft',
    'Ready for Dev': 'Ready for Review',  // ClickUp-specific status
    'Ready for Review': 'Ready for Review',
    'Review': 'Review',
    'In Progress': 'In Progress',
    'Done': 'Done',
    'Blocked': 'Blocked',
  },
};

/**
 * Maps an LMAS story status to ClickUp story-status custom field value
 *
 * @param {string} lmasStatus - Local .md file status
 * @returns {string} ClickUp story-status value
 */
function mapStatusToClickUp(lmasStatus) {
  const mapped = STATUS_MAPPING.LMAS_TO_CLICKUP[lmasStatus];

  if (!mapped) {
    console.warn(`Unknown LMAS status: ${lmasStatus}, using as-is`);
    return lmasStatus;
  }

  return mapped;
}

/**
 * Maps a ClickUp story-status custom field value to LMAS story status
 *
 * @param {string} clickupStatus - ClickUp story-status value
 * @returns {string} Local .md file status
 */
function mapStatusFromClickUp(clickupStatus) {
  const mapped = STATUS_MAPPING.CLICKUP_TO_LMAS[clickupStatus];

  if (!mapped) {
    console.warn(`Unknown ClickUp status: ${clickupStatus}, using as-is`);
    return clickupStatus;
  }

  return mapped;
}

/**
 * Validates if a status is a valid LMAS story status
 *
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid
 */
function isValidLMASStatus(status) {
  return Object.keys(STATUS_MAPPING.LMAS_TO_CLICKUP).includes(status);
}

/**
 * Validates if a status is a valid ClickUp story-status value
 *
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid
 */
function isValidClickUpStatus(status) {
  return Object.keys(STATUS_MAPPING.CLICKUP_TO_LMAS).includes(status);
}

/**
 * Gets all valid LMAS story statuses
 *
 * @returns {string[]} Array of valid statuses
 */
function getValidLMASStatuses() {
  return Object.keys(STATUS_MAPPING.LMAS_TO_CLICKUP);
}

/**
 * Gets all valid ClickUp story-status values
 *
 * @returns {string[]} Array of valid statuses
 */
function getValidClickUpStatuses() {
  return Object.keys(STATUS_MAPPING.CLICKUP_TO_LMAS);
}

module.exports = {
  mapStatusToClickUp,
  mapStatusFromClickUp,
  isValidLMASStatus,
  isValidClickUpStatus,
  getValidLMASStatuses,
  getValidClickUpStatuses,
  STATUS_MAPPING, // Export for testing
};
