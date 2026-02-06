// lib/utils.ts
// Shared utility functions

/**
 * Extract repository name from git URL
 * e.g., "https://github.com/owner/repo.git" -> "repo"
 */
export function extractRepoName(url: string): string {
  const cleanUrl = url.replace(/\.git$/, '').replace(/\/$/, '');
  const parts = cleanUrl.split(/[\/:]/);
  return parts[parts.length - 1]?.toLowerCase().replace(/[^a-z0-9-]/g, '') || '';
}

/**
 * Generate Docker image name from repository URL and context path
 * e.g., ("https://github.com/owner/myapp", "services/api") -> "myapp-services-api"
 */
export function generateImageName(repoUrl: string, contextPath: string): string {
  const repoName = extractRepoName(repoUrl);
  if (contextPath && contextPath !== '.') {
    const suffix = contextPath
      .replace(/\//g, '-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    return `${repoName}-${suffix}`;
  }
  return repoName;
}

/**
 * Generate unique ID for local state
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}
