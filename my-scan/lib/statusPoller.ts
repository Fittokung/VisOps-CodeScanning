// lib/statusPoller.ts
/**
 * Client-side hook for polling scan status
 * Use this in React components to get real-time updates
 */

import { useEffect, useState } from 'react';

export interface ActiveScan {
  scanId: string;
  serviceName: string;
  imageName: string;
  status: string;
  scanMode: string;
  queuedAt: Date;
  startedAt?: Date;
}

export interface RecentScan {
  scanId: string;
  serviceName: string;
  imageName: string;
  status: string;
  completedAt: Date;
  vulnCritical: number;
  vulnHigh: number;
}

export interface ScanStatusData {
  active: ActiveScan[];
  recentCompleted: RecentScan[];
  summary: {
    activeCount: number;
    queuedCount: number;
    processingCount: number;
  };
}

export function useScanStatus(pollInterval: number = 5000) {
  const [data, setData] = useState<ScanStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/scan/status/active');
        
        if (!response.ok) {
          throw new Error('Failed to fetch scan status');
        }

        const result = await response.json();
        
        if (isMounted) {
          setData(result);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      } finally {
        // Schedule next poll
        if (isMounted) {
          timeoutId = setTimeout(fetchStatus, pollInterval);
        }
      }
    };

    // Initial fetch
    fetchStatus();

    // Cleanup
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pollInterval]);

  return { data, loading, error };
}

// Example usage in a React component:
/*
function NavBar() {
  const { data, loading, error } = useScanStatus(5000);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <span>Active Scans: {data?.summary.activeCount || 0}</span>
      {data?.active.map(scan => (
        <div key={scan.scanId}>
          {scan.serviceName} - {scan.status}
        </div>
      ))}
    </div>
  );
}
*/
