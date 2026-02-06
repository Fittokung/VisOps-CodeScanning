// components/hooks/useProjectActions.ts
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectActionsResult {
  isLoading: boolean;
  error: string | null;
  deleteProject: (groupId: string) => Promise<boolean>;
  updateProject: (groupId: string, groupName: string, repoUrl: string) => Promise<boolean>;
  triggerScan: (serviceId: string, repoUrl: string, options?: ScanOptions) => Promise<string | null>;
}

interface ScanOptions {
  imageName?: string;
  imageTag?: string;
  buildMode?: boolean;
  githubCredentialId?: string;
  dockerCredentialId?: string;
}

/**
 * Custom hook for project CRUD operations
 */
export function useProjectActions(): ProjectActionsResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const deleteProject = useCallback(async (groupId: string): Promise<boolean> => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete project');
      }

      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Delete project error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProject = useCallback(async (
    groupId: string,
    groupName: string,
    repoUrl: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName, repoUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update project');
      }

      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Update project error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const triggerScan = useCallback(async (
    serviceId: string,
    repoUrl: string,
    options: ScanOptions = {}
  ): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          repoUrl,
          ...options,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start scan');
      }

      const data = await response.json();
      return data.scanId || data.pipelineId;
    } catch (err: any) {
      setError(err.message);
      console.error('Trigger scan error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    deleteProject,
    updateProject,
    triggerScan,
  };
}
