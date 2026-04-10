import https from "https";
import http from "http";
import { generateContentHash } from "../hash";
import { normalizeJobData } from "../normalizer";

interface RawJobDetail {
  title: string;
  location_raw: string;
  employment_type: string;
  description: string;
  requirements?: string;
  source_job_id: string;
  source_url: string;
}

export class PhoenixChildrensSource {
  private readonly LISTING_URL =
    "https://careers.phoenixchildrens.com/Positions/Nursing-jobs";
  private readonly DETAIL_URL_BASE =
    "https://careers.phoenixchildrens.com/Positions/Posting";
  private readonly TIMEOUT = 30000;
  private readonly MAX_RETRIES = 2;

  /**
   * Fetch listing page and extract all posting IDs using regex
   */
  async fetchListingPage(): Promise<{
    success: boolean;
    postingIds: string[];
    pageHash: string;
    jobCount: number;
    error?: string;
  }> {
    try {
      const html = await this.fetchWithRetry(this.LISTING_URL);

      // Extract all unique posting IDs via regex
      const matches = html.matchAll(/data-posting-id="(\d+)"/g);
      const postingIds = [...new Set([...matches].map((m) => m[1]))];

      // Generate page hash for change detection
      const pageHash = generateContentHash(html);

      return {
        success: postingIds.length > 0,
        postingIds,
        pageHash,
        jobCount: postingIds.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        postingIds: [],
        pageHash: "",
        jobCount: 0,
        error: `Listing fetch failed: ${message}`,
      };
    }
  }

  /**
   * Fetch and parse a single job detail page
   */
  async fetchJobDetail(jobId: string): Promise<{
    success: boolean;
    data?: RawJobDetail;
    error?: string;
  }> {
    try {
      const detailUrl = `${this.DETAIL_URL_BASE}/${jobId}`;
      const html = await this.fetchWithRetry(detailUrl);

      if (!html) {
        return {
          success: false,
          error: "Empty HTML response",
        };
      }

      // Extract title - fallback chain
      let title =
        html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1]?.trim() ||
        html.match(/<h2[^>]*>(.*?)<\/h2>/i)?.[1]?.trim() ||
        html.match(/<title>(.*?)<\/title>/i)?.[1]?.match(/^(.*?)\s*-/)?.[1]?.trim() ||
        "";

      if (!title) {
        return {
          success: false,
          error: "Could not extract title",
        };
      }

      title = this.cleanTitle(title);

      // Extract location - use known span pattern
      let locationRaw = "";
      const locationMatch = html.match(
        /<span[^>]*>[Ll]ocation:<\/span>\s*([^<]+)</
      );
      if (locationMatch) {
        locationRaw = this.cleanText(locationMatch[1]);
      } else {
        // Fallback: look for city name
        const cityMatch = html.match(
          /Phoenix|Scottsdale|Tucson|Mesa|Chandler|Tempe/i
        );
        if (cityMatch) {
          locationRaw = cityMatch[0];
        }
      }

      // Extract employment type
      let employmentType = "Full-time";
      const empMatch = html.match(
        /<span[^>]*>[Ee]mployment\s+[Tt]ype:<\/span>\s*([^<]+)</
      );
      if (empMatch) {
        employmentType = this.normalizeEmploymentType(
          this.cleanText(empMatch[1])
        );
      }

      // Extract description (first 2000 chars of body text)
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      let description = "";
      if (bodyMatch) {
        // Remove HTML tags and get clean text
        description = bodyMatch[1]
          .replace(/<[^>]*>/g, "")
          .substring(0, 2000)
          .trim();
        description = this.cleanText(description);
      }

      // Extract requirements if present
      let requirements = "";
      const reqMatch = html.match(
        /[Rr]equirements?[:\s]*([^<]*(?:<li[^>]*>[^<]*<\/li>[^<]*)*)/i
      );
      if (reqMatch) {
        requirements = this.cleanText(reqMatch[1].substring(0, 1000));
      }

      return {
        success: true,
        data: {
          source_job_id: jobId,
          source_url: `${this.DETAIL_URL_BASE}/${jobId}`,
          title,
          location_raw: locationRaw || "Unknown",
          employment_type: employmentType,
          description,
          requirements: requirements || undefined,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Detail fetch failed for job ${jobId}: ${message}`,
      };
    }
  }

  /**
   * Fetch with exponential backoff retry logic
   */
  private async fetchWithRetry(url: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await this.fetchUrl(url);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Fetch failed after retries");
  }

  /**
   * Single fetch attempt
   */
  private fetchUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith("https") ? https : http;
      const timeout = setTimeout(() => {
        reject(new Error("Request timeout"));
      }, this.TIMEOUT);

      const req = protocol.get(
        url,
        { headers: { "User-Agent": "Mozilla/5.0" } },
        (res) => {
          clearTimeout(timeout);

          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }

          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            resolve(data);
          });
        }
      );

      req.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Normalize employment type to canonical values
   */
  private normalizeEmploymentType(type: string): string {
    const normalized = type.toLowerCase().trim();
    if (normalized.includes("full")) return "Full-time";
    if (normalized.includes("part")) return "Part-time";
    if (normalized.includes("contract")) return "Contract";
    if (normalized.includes("temporary")) return "Contract";
    if (normalized.includes("per diem")) return "Per Diem";
    return type;
  }

  /**
   * Clean title of HTML entities and extra whitespace
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/&#\d+;/g, "")
      .replace(/&[a-z]+;/g, "")
      .replace(/\s+/g, " ")
      .substring(0, 200)
      .trim();
  }

  /**
   * Clean text of extra whitespace
   */
  private cleanText(text: string): string {
    if (!text) return "";
    return text
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[\r\n]+/g, " ")
      .substring(0, 500);
  }
}

export const phoenixChildrens = new PhoenixChildrensSource();
