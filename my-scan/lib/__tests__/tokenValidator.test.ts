// lib/__tests__/tokenValidator.test.ts
// Unit tests for token validation module

import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

import { validateGitHubToken, validateDockerHubToken, validateAllTokens } from '../tokenValidator';

describe('TokenValidator Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateGitHubToken', () => {
    it('should return invalid for empty token', async () => {
      const result = await validateGitHubToken('');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token is empty');
    });

    it('should return invalid for whitespace-only token', async () => {
      const result = await validateGitHubToken('   ');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token is empty');
    });

    it('should return valid with username for valid token with repo scope', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { login: 'testuser' },
        headers: { 'x-oauth-scopes': 'repo, user' },
      });
      
      const result = await validateGitHubToken('ghp_valid_token');
      
      expect(result.valid).toBe(true);
      expect(result.username).toBe('testuser');
      expect(result.scopes).toContain('repo');
    });

    it('should return valid for public_repo scope', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { login: 'testuser' },
        headers: { 'x-oauth-scopes': 'public_repo' },
      });
      
      const result = await validateGitHubToken('ghp_valid_token');
      
      expect(result.valid).toBe(true);
    });

    it('should return invalid when missing repo scope', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { login: 'testuser' },
        headers: { 'x-oauth-scopes': 'user, gist' },
      });
      
      const result = await validateGitHubToken('ghp_limited_token');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('repo');
    });

    it('should return invalid for 401 error (expired token)', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 401 },
      });
      
      const result = await validateGitHubToken('ghp_expired_token');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid or expired');
    });

    it('should return invalid for 403 error (forbidden)', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 403 },
      });
      
      const result = await validateGitHubToken('ghp_forbidden_token');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('permissions');
    });

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));
      
      const result = await validateGitHubToken('ghp_token');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Network Error');
    });
  });

  describe('validateDockerHubToken', () => {
    it('should return invalid for empty username', async () => {
      const result = await validateDockerHubToken('', 'token');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Docker username is empty');
    });

    it('should return invalid for empty token', async () => {
      const result = await validateDockerHubToken('user', '');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Docker token is empty');
    });

    it('should return valid for successful authentication', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { token: 'jwt-token-here' },
      });
      
      const result = await validateDockerHubToken('testuser', 'dckr_pat_token');
      
      expect(result.valid).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://hub.docker.com/v2/users/login',
        { username: 'testuser', password: 'dckr_pat_token' },
        expect.any(Object)
      );
    });

    it('should return invalid when no token in response', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {},
      });
      
      const result = await validateDockerHubToken('user', 'token');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('authentication failed');
    });

    it('should return invalid for 401 error', async () => {
      mockedAxios.post.mockRejectedValue({
        response: { status: 401 },
      });
      
      const result = await validateDockerHubToken('user', 'bad_token');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid Docker Hub credentials');
    });

    it('should handle network errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Connection refused'));
      
      const result = await validateDockerHubToken('user', 'token');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Connection refused');
    });
  });

  describe('validateAllTokens', () => {
    it('should validate both tokens in parallel', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { login: 'githubuser' },
        headers: { 'x-oauth-scopes': 'repo' },
      });
      mockedAxios.post.mockResolvedValue({
        data: { token: 'jwt' },
      });
      
      const result = await validateAllTokens('ghp_token', 'dockeruser', 'docker_token');
      
      expect(result.githubValid).toBe(true);
      expect(result.dockerValid).toBe(true);
      expect(result.githubUsername).toBe('githubuser');
    });

    it('should return both errors when both fail', async () => {
      mockedAxios.get.mockRejectedValue({ response: { status: 401 } });
      mockedAxios.post.mockRejectedValue({ response: { status: 401 } });
      
      const result = await validateAllTokens('bad_gh', 'bad_docker', 'bad_token');
      
      expect(result.githubValid).toBe(false);
      expect(result.dockerValid).toBe(false);
      expect(result.errors.github).toBeDefined();
      expect(result.errors.docker).toBeDefined();
    });

    it('should handle partial success (GitHub valid, Docker invalid)', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { login: 'user' },
        headers: { 'x-oauth-scopes': 'repo' },
      });
      mockedAxios.post.mockRejectedValue({ response: { status: 401 } });
      
      const result = await validateAllTokens('ghp_token', 'user', 'bad');
      
      expect(result.githubValid).toBe(true);
      expect(result.dockerValid).toBe(false);
    });
  });
});
