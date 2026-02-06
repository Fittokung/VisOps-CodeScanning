// components/hooks/useAccounts.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

interface Account {
  id: string;
  name: string;
  username: string;
  isDefault: boolean;
  provider: 'GITHUB' | 'DOCKER';
}

interface UseAccountsResult {
  githubAccounts: Account[];
  dockerAccounts: Account[];
  selectedGithubId: string;
  selectedDockerId: string;
  setSelectedGithubId: (id: string) => void;
  setSelectedDockerId: (id: string) => void;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to manage GitHub and Docker account selection
 */
export function useAccounts(): UseAccountsResult {
  const [githubAccounts, setGithubAccounts] = useState<Account[]>([]);
  const [dockerAccounts, setDockerAccounts] = useState<Account[]>([]);
  const [selectedGithubId, setSelectedGithubId] = useState<string>('');
  const [selectedDockerId, setSelectedDockerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user/settings/credentials');
      
      if (!response.ok) {
        throw new Error('Failed to fetch credentials');
      }

      const data = await response.json();
      const credentials = data.credentials || [];

      // Separate by provider
      const github: Account[] = [];
      const docker: Account[] = [];

      credentials.forEach((cred: any) => {
        const account: Account = {
          id: cred.id,
          name: cred.name || cred.username,
          username: cred.username,
          isDefault: cred.isDefault,
          provider: cred.provider,
        };

        if (cred.provider === 'GITHUB') {
          github.push(account);
        } else if (cred.provider === 'DOCKER') {
          docker.push(account);
        }
      });

      setGithubAccounts(github);
      setDockerAccounts(docker);

      // Set defaults
      const defaultGithub = github.find(a => a.isDefault) || github[0];
      const defaultDocker = docker.find(a => a.isDefault) || docker[0];

      if (defaultGithub && !selectedGithubId) {
        setSelectedGithubId(defaultGithub.id);
      }
      if (defaultDocker && !selectedDockerId) {
        setSelectedDockerId(defaultDocker.id);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch accounts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGithubId, selectedDockerId]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  return {
    githubAccounts,
    dockerAccounts,
    selectedGithubId,
    selectedDockerId,
    setSelectedGithubId,
    setSelectedDockerId,
    isLoading,
    error,
    refetch: fetchAccounts,
  };
}
