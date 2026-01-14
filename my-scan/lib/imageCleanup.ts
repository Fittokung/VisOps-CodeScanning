// lib/imageCleanup.ts
/**
 * Image Cleanup Utility
 * Handles deletion of Docker images that failed security checks
 */

import axios from "axios";
import https from "https";

interface ImageCleanupOptions {
  projectId: string;
  pipelineId: string;
  imageName?: string;
  imageTag?: string;
}

/**
 * Delete Docker image from GitLab Container Registry when scan is blocked
 */
export async function deleteBlockedImage(
  options: ImageCleanupOptions
): Promise<{ success: boolean; message: string }> {
  const { projectId, pipelineId, imageName, imageTag } = options;

  const baseUrl = process.env.GITLAB_API_URL?.replace(/\/$/, "");
  const token = process.env.GITLAB_TOKEN;
  const agent = new https.Agent({ rejectUnauthorized: false });

  if (!baseUrl || !token) {
    console.error("❌ Missing GitLab configuration for image cleanup");
    return { success: false, message: "Missing GitLab configuration" };
  }

  try {
    console.log(
      `🗑️  Attempting to delete blocked image for pipeline ${pipelineId}`
    );

    // Get repositories in the project
    const reposRes = await axios.get(
      `${baseUrl}/api/v4/projects/${projectId}/registry/repositories`,
      {
        headers: { "PRIVATE-TOKEN": token },
        httpsAgent: agent,
      }
    );

    if (!reposRes.data || reposRes.data.length === 0) {
      console.log("⚠️  No container registry repositories found");
      return { success: true, message: "No images to delete" };
    }

    // Find matching repository
    const repo = reposRes.data.find(
      (r: any) =>
        !imageName || r.name === imageName || r.path.includes(imageName)
    );

    if (!repo) {
      console.log(`⚠️  Repository not found for image: ${imageName}`);
      return { success: true, message: "Image repository not found" };
    }

    // Get tags for this repository
    const tagsRes = await axios.get(
      `${baseUrl}/api/v4/projects/${projectId}/registry/repositories/${repo.id}/tags`,
      {
        headers: { "PRIVATE-TOKEN": token },
        httpsAgent: agent,
      }
    );

    if (!tagsRes.data || tagsRes.data.length === 0) {
      console.log("⚠️  No tags found in repository");
      return { success: true, message: "No image tags to delete" };
    }

    // Find the tag to delete (match by tag name or find latest)
    const tagToDelete = imageTag
      ? tagsRes.data.find((t: any) => t.name === imageTag)
      : tagsRes.data[0]; // Delete latest if no specific tag

    if (!tagToDelete) {
      console.log(`⚠️  Tag not found: ${imageTag}`);
      return { success: true, message: "Image tag not found" };
    }

    // Delete the tag
    await axios.delete(
      `${baseUrl}/api/v4/projects/${projectId}/registry/repositories/${repo.id}/tags/${tagToDelete.name}`,
      {
        headers: { "PRIVATE-TOKEN": token },
        httpsAgent: agent,
      }
    );

    console.log(
      `✅ Successfully deleted image: ${repo.path}:${tagToDelete.name}`
    );
    return {
      success: true,
      message: `Deleted blocked image: ${repo.path}:${tagToDelete.name}`,
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log("⚠️  Image or tag not found (may already be deleted)");
      return { success: true, message: "Image already deleted or not found" };
    }

    console.error("❌ Error deleting blocked image:", error.message);
    return {
      success: false,
      message: `Failed to delete image: ${error.message}`,
    };
  }
}

/**
 * Check if image should be deleted based on scan results
 */
export function shouldDeleteImage(
  scanStatus: string,
  criticalCount: number,
  highCount: number
): boolean {
  // Delete image if scan is blocked or has critical vulnerabilities
  return scanStatus === "BLOCKED" || criticalCount > 0;
}
