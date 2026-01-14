// Scan Configuration
// Centralized configuration for scan-related settings

/**
 * Maximum number of scan history records to keep per service
 * Older scans will be automatically deleted when this limit is exceeded
 *
 * Default: 10 scans per service
 * Recommended range: 5-20 scans
 *
 * Note: Increasing this value will use more database storage
 */
export const MAX_SCANS_PER_SERVICE = 5;

/**
 * Enable automatic cleanup of old scans
 * When true, old scans are deleted automatically after new scans
 * When false, all scans are kept indefinitely
 */
export const AUTO_CLEANUP_ENABLED = true;

/**
 * Maximum age of scan history records in days
 * Scans older than this will be automatically deleted
 *
 * Default: 365 days (1 year)
 * Set to 0 to disable age-based cleanup
 *
 * Note: Both count-based and age-based cleanup work together
 */
export const MAX_SCAN_AGE_DAYS = 365;
