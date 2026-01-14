// lib/tokenValidator.ts
import axios from 'axios';

/**
 * Validates GitHub Personal Access Token
 * Checks if token has proper scopes and is valid
 */
export async function validateGitHubToken(token: string): Promise<{
  valid: boolean;
  username?: string;
  scopes?: string[];
  error?: string;
}> {
  if (!token || token.trim().length === 0) {
    return { valid: false, error: "Token is empty" };
  }

  try {
    // GitHub API to verify token
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      timeout: 10000
    });

    // Extract scopes from response headers
    const scopes = response.headers['x-oauth-scopes']?.split(', ') || [];
    
    // Check if token has required scopes (repo:read at minimum)
    const hasRepoScope = scopes.includes('repo') || scopes.includes('public_repo');
    
    if (!hasRepoScope) {
      return { 
        valid: false, 
        error: "Token does not have required 'repo' scope. Please create a token with repo access.",
        scopes 
      };
    }

    return {
      valid: true,
      username: response.data.login,
      scopes
    };
  } catch (error: any) {
    if (error.response?.status === 401) {
      return { valid: false, error: "Invalid or expired GitHub token" };
    }
    if (error.response?.status === 403) {
      return { valid: false, error: "GitHub token lacks necessary permissions" };
    }
    return { 
      valid: false, 
      error: error.message || "Failed to validate GitHub token" 
    };
  }
}

/**
 * Validates Docker Hub Token (Personal Access Token or Password)
 * Tests authentication against Docker Hub API
 */
export async function validateDockerHubToken(
  username: string, 
  token: string
): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: "Docker username is empty" };
  }
  
  if (!token || token.trim().length === 0) {
    return { valid: false, error: "Docker token is empty" };
  }

  try {
    // Docker Hub Login API
    const response = await axios.post(
      'https://hub.docker.com/v2/users/login',
      {
        username: username,
        password: token
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    // If we get a token back, authentication succeeded
    if (response.data?.token) {
      return { valid: true };
    }
    
    return { valid: false, error: "Docker Hub authentication failed" };
  } catch (error: any) {
    if (error.response?.status === 401) {
      return { valid: false, error: "Invalid Docker Hub credentials" };
    }
    return { 
      valid: false, 
      error: error.message || "Failed to validate Docker Hub token" 
    };
  }
}

/**
 * Validates both tokens in parallel
 * Used during onboarding setup
 */
export async function validateAllTokens(
  githubToken: string,
  dockerUsername: string,
  dockerToken: string
): Promise<{
  githubValid: boolean;
  dockerValid: boolean;
  githubUsername?: string;
  errors: {
    github?: string;
    docker?: string;
  };
}> {
  const [githubResult, dockerResult] = await Promise.all([
    validateGitHubToken(githubToken),
    validateDockerHubToken(dockerUsername, dockerToken)
  ]);

  return {
    githubValid: githubResult.valid,
    dockerValid: dockerResult.valid,
    githubUsername: githubResult.username,
    errors: {
      github: githubResult.error,
      docker: dockerResult.error
    }
  };
}
