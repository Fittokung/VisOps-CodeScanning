import axios from "axios";

const GITLAB_API_URL = process.env.GITLAB_API_URL || "https://gitlab.com/api/v4";
const GITLAB_PROJECT_ID = process.env.GITLAB_PROJECT_ID || "141";
const GITLAB_TOKEN = process.env.GITLAB_TOKEN;

// Timeout for GitLab API calls (5 seconds)
const TIMEOUT_MS = 5000;

export interface GitLabPipelineShort {
  id: number;
  status: string;
  web_url: string;
}

/**
 * Fetches the real-time status of a pipeline from GitLab.
 * Returns null if the pipeline is not found (404).
 */
export async function getPipelineStatus(pipelineId: string): Promise<GitLabPipelineShort | null> {
  if (!GITLAB_TOKEN) {
    console.warn("[GitLab] Missing GITLAB_TOKEN, cannot verify status.");
    return null;
  }

  // If pipelineId is not a number (e.g. "WAITING-123"), it's not on GitLab yet
  if (!/^\d+$/.test(pipelineId)) {
    return null;
  }

  try {
    const url = `${GITLAB_API_URL}/projects/${GITLAB_PROJECT_ID}/pipelines/${pipelineId}`;
    const response = await axios.get(url, {
      headers: { "PRIVATE-TOKEN": GITLAB_TOKEN },
      timeout: TIMEOUT_MS,
    });

    return {
      id: response.data.id,
      status: response.data.status,
      web_url: response.data.web_url,
    };
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return null; // Pipeline not found
      }
      console.error(`[GitLab] Error checking pipeline ${pipelineId}:`, error.message);
    }
    throw error;
  }
}
