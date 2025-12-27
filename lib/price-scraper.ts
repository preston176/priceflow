/**
 * Price Scraping Service
 * Extracts prices from product URLs for major retailers
 * Uses CSS selectors for known retailers, falls back to AI extraction for others
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

interface PriceResult {
  success: boolean;
  price?: number;
  currency?: string;
  source?: string;
  error?: string;
}

/**
 * Retry wrapper for AI calls with exponential backoff
 * Retries: 0s, 2s, 4s, 8s (3 retries total)
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 2000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Validate and extract JSON from AI response
 * Handles malformed responses and provides clear errors
 */
function extractAndValidateJSON<T>(
  text: string,
  schema: { [K in keyof T]?: string }
): T | null {
  try {
    // Try to find JSON object in response
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", text);
      return null;
    }

    // Parse JSON
    const data = JSON.parse(jsonMatch[0]);

    // Validate required fields exist
    for (const key in schema) {
      if (schema[key] === "required" && !(key in data)) {
        console.error(`Missing required field: ${key}`);
        return null;
      }
    }

    return data as T;
  } catch (error) {
    console.error("JSON parse error:", error);
    return null;
  }
}

/**
 * Fetch URL through SerpAPI for better success rate
 * Requires SERPAPI_KEY environment variable
 */
async function fetchWithSerpAPI(url: string): Promise<string | null> {
  const serpApiKey = process.env.SERPAPI_KEY;

  if (!serpApiKey) {
    return null;
  }

  try {
    // Use SerpAPI's general scraping endpoint
    const apiUrl = `https://serpapi.com/search.json?engine=google&url=${encodeURIComponent(url)}&api_key=${serpApiKey}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`SerpAPI failed: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // SerpAPI returns the HTML in the 'html' field when using url parameter
    if (data.html) {
      return data.html;
    }

    console.error('SerpAPI: No HTML in response');
    return null;
  } catch (error) {
    console.error('SerpAPI error:', error);
    return null;
  }
}

/**
 * Universal fetch function that tries SerpAPI first, then falls back to direct fetch
 */
async function fetchPage(url: string): Promise<{ success: boolean; html?: string; error?: string }> {
  // Try SerpAPI first if configured
  if (process.env.SERPAPI_KEY) {
    const html = await fetchWithSerpAPI(url);
    if (html) {
      return { success: true, html };
    }
    console.log('SerpAPI failed, falling back to direct fetch...');
  }

  // Fall back to direct fetch
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch page" };
    }

    const html = await response.text();
    return { success: true, html };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Extract price from Amazon product page
 */
async function scrapeAmazon(url: string): Promise<PriceResult> {
  try {
    const result = await fetchPage(url);

    if (!result.success || !result.html) {
      return { success: false, error: result.error || "Failed to fetch page" };
    }

    const html = result.html;

    // Try multiple selectors Amazon uses for prices
    const pricePatterns = [
      /\$([0-9,]+\.\d{2})/,  // $99.99
      /USD\s*([0-9,]+\.\d{2})/,  // USD 99.99
      /"price":"([0-9.]+)"/,  // JSON price
    ];

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(price) && price > 0) {
          return {
            success: true,
            price,
            currency: "USD",
            source: "amazon",
          };
        }
      }
    }

    return { success: false, error: "Price not found on page" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Extract price from Walmart product page
 */
async function scrapeWalmart(url: string): Promise<PriceResult> {
  try {
    const result = await fetchPage(url);

    if (!result.success || !result.html) {
      return { success: false, error: result.error || "Failed to fetch page" };
    }

    const html = result.html;

    const pricePatterns = [
      /"currentPrice":\s*"([0-9.]+)"/,
      /\$([0-9,]+\.\d{2})/,
      /"price":"([0-9.]+)"/,
    ];

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(price) && price > 0) {
          return {
            success: true,
            price,
            currency: "USD",
            source: "walmart",
          };
        }
      }
    }

    return { success: false, error: "Price not found on page" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Extract price from Target product page
 */
async function scrapeTarget(url: string): Promise<PriceResult> {
  try {
    const result = await fetchPage(url);

    if (!result.success || !result.html) {
      return { success: false, error: result.error || "Failed to fetch page" };
    }

    const html = result.html;

    const pricePatterns = [
      /"current_retail":\s*"([0-9.]+)"/,
      /\$([0-9,]+\.\d{2})/,
      /"price":\s*([0-9.]+)/,
    ];

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(price) && price > 0) {
          return {
            success: true,
            price,
            currency: "USD",
            source: "target",
          };
        }
      }
    }

    return { success: false, error: "Price not found on page" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Extract price from Best Buy product page
 */
async function scrapeBestBuy(url: string): Promise<PriceResult> {
  try {
    const result = await fetchPage(url);

    if (!result.success || !result.html) {
      return { success: false, error: result.error || "Failed to fetch page" };
    }

    const html = result.html;

    const pricePatterns = [
      /"salePrice":\s*([0-9.]+)/,
      /\$([0-9,]+\.\d{2})/,
      /"price":\s*"([0-9.]+)"/,
    ];

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(price) && price > 0) {
          return {
            success: true,
            price,
            currency: "USD",
            source: "bestbuy",
          };
        }
      }
    }

    return { success: false, error: "Price not found on page" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Detect retailer from URL and scrape price
 */
export async function scrapePrice(url: string): Promise<PriceResult> {
  if (!url) {
    return { success: false, error: "No URL provided" };
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    let result: PriceResult;

    // Route to appropriate scraper based on domain
    if (hostname.includes("amazon.com")) {
      result = await scrapeAmazon(url);
    } else if (hostname.includes("walmart.com")) {
      result = await scrapeWalmart(url);
    } else if (hostname.includes("target.com")) {
      result = await scrapeTarget(url);
    } else if (hostname.includes("bestbuy.com")) {
      result = await scrapeBestBuy(url);
    } else {
      // Try generic scraper first
      result = await scrapeGeneric(url);
    }

    // If CSS scraping failed and AI is available, try AI extraction
    if (!result.success && process.env.GEMINI_API_KEY) {
      console.log(
        `CSS scraping failed for ${hostname}, trying AI extraction...`
      );
      result = await scrapePriceWithAI(url);
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid URL",
    };
  }
}

/**
 * Generic price scraper for unsupported retailers
 * Tries common price patterns
 */
async function scrapeGeneric(url: string): Promise<PriceResult> {
  try {
    const result = await fetchPage(url);

    if (!result.success || !result.html) {
      return { success: false, error: result.error || "Failed to fetch page" };
    }

    const html = result.html;

    // Try common price patterns
    const pricePatterns = [
      /\$([0-9,]+\.\d{2})/,  // $99.99
      /USD\s*([0-9,]+\.\d{2})/,  // USD 99.99
      /"price"[:\s]+"?([0-9.]+)"?/,  // "price": 99.99
      /price[:\s]+"?\$?([0-9,]+\.\d{2})"?/i,  // price: $99.99
    ];

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(price) && price > 0 && price < 1000000) {
          return {
            success: true,
            price,
            currency: "USD",
            source: "generic",
          };
        }
      }
    }

    return {
      success: false,
      error: "Price not found - manual update required",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if URL is from a supported retailer
 */
export function isSupportedRetailer(url: string): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    const supportedDomains = [
      "amazon.com",
      "walmart.com",
      "target.com",
      "bestbuy.com",
    ];

    return supportedDomains.some((domain) => hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Get retailer name from URL
 */
export function getRetailerName(url: string): string {
  if (!url) return "Unknown";

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes("amazon.com")) return "Amazon";
    if (hostname.includes("walmart.com")) return "Walmart";
    if (hostname.includes("target.com")) return "Target";
    if (hostname.includes("bestbuy.com")) return "Best Buy";

    return hostname.replace("www.", "");
  } catch {
    return "Unknown";
  }
}

/**
 * Extract product metadata (name, image, price) from URL
 * Uses AI to intelligently extract all product information
 */
export async function extractProductMetadata(url: string): Promise<{
  success: boolean;
  name?: string;
  imageUrl?: string;
  price?: number;
  error?: string;
}> {
  try {
    if (!url) {
      return { success: false, error: "No URL provided" };
    }

    // Fetch the page
    const result = await fetchPage(url);

    if (!result.success || !result.html) {
      return { success: false, error: result.error || "Failed to fetch page" };
    }

    const html = result.html;

    // Extract metadata using meta tags and common patterns first (fast)
    let productName = "";
    let imageUrl = "";
    let price: number | undefined;

    // Try to get product name from meta tags
    const titleMatch = html.match(
      /<meta property="og:title" content="([^"]+)"/i
    );
    if (titleMatch) productName = titleMatch[1];

    if (!productName) {
      const twitterTitleMatch = html.match(
        /<meta name="twitter:title" content="([^"]+)"/i
      );
      if (twitterTitleMatch) productName = twitterTitleMatch[1];
    }

    if (!productName) {
      const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleTagMatch) productName = titleTagMatch[1];
    }

    // Try to get image from meta tags
    const ogImageMatch = html.match(
      /<meta property="og:image" content="([^"]+)"/i
    );
    if (ogImageMatch) imageUrl = ogImageMatch[1];

    if (!imageUrl) {
      const twitterImageMatch = html.match(
        /<meta name="twitter:image" content="([^"]+)"/i
      );
      if (twitterImageMatch) imageUrl = twitterImageMatch[1];
    }

    // Try to get price using existing scraper
    const priceResult = await scrapePrice(url);
    if (priceResult.success && priceResult.price) {
      price = priceResult.price;
    }

    // If we have basic metadata, return it
    if (productName || imageUrl || price) {
      return {
        success: true,
        name: productName || undefined,
        imageUrl: imageUrl || undefined,
        price,
      };
    }

    // If no metadata found and AI is available, use AI extraction
    if (process.env.GEMINI_API_KEY) {
      const aiResult = await extractMetadataWithAI(html, url);
      if (aiResult.success) {
        return aiResult;
      }
    }

    return {
      success: false,
      error: "Could not extract product information",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Extract product metadata using Gemini AI
 * Fallback when meta tags don't provide enough info
 */
async function extractMetadataWithAI(
  html: string,
  url: string
): Promise<{
  success: boolean;
  name?: string;
  imageUrl?: string;
  price?: number;
  error?: string;
}> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const cleanedHtml = cleanHtmlForLLM(html);

    const prompt = `You are a product information extraction assistant. Extract product details from this page.

CRITICAL RULES - FOLLOW EXACTLY:
1. Return ONLY a valid JSON object with this exact structure:
   {
     "name": "Product Name" or null,
     "imageUrl": "https://full-url.jpg" or null,
     "price": 19.99 or null
   }

2. Validation rules:
   - name: String or null (product title)
   - imageUrl: Full valid URL starting with http/https, or null
   - price: Number without currency symbol, or null

3. If there's a sale price and original price, use the SALE PRICE
4. For imageUrl, prefer og:image meta tag or main product image
5. Do NOT include any text before or after the JSON
6. Do NOT use relative URLs for images

EXAMPLES OF VALID RESPONSES:
{"name": "Sony Headphones", "imageUrl": "https://example.com/img.jpg", "price": 299.99}
{"name": "Product Name", "imageUrl": null, "price": 49.99}
{"name": null, "imageUrl": null, "price": null}

HTML Content:
${cleanedHtml}

Base URL: ${url}

JSON RESPONSE:`;

    // Retry with backoff
    const result = await retryWithBackoff(async () => {
      const res = await model.generateContent(prompt);
      const text = res.response.text().trim();

      // Validate JSON response
      const data = extractAndValidateJSON<{
        name: string | null;
        imageUrl: string | null;
        price: number | null;
      }>(text, {
        name: "required",
        imageUrl: "required",
        price: "required",
      });

      if (!data) {
        throw new Error("Invalid JSON response from AI");
      }

      // Additional validation
      if (data.imageUrl && !data.imageUrl.startsWith("http")) {
        console.warn("Invalid image URL, setting to null");
        data.imageUrl = null;
      }

      if (data.price && (isNaN(Number(data.price)) || Number(data.price) <= 0)) {
        console.warn("Invalid price, setting to null");
        data.price = null;
      }

      return data;
    });

    return {
      success: true,
      name: result.name || undefined,
      imageUrl: result.imageUrl || undefined,
      price: result.price ? parseFloat(result.price.toString()) : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI extraction failed",
    };
  }
}

/**
 * Extract product metadata from screenshot using Gemini Vision
 * Analyzes product page screenshots to extract name, price, and image
 */
export async function extractMetadataFromScreenshot(
  imageBase64: string
): Promise<{
  success: boolean;
  name?: string;
  price?: number;
  error?: string;
}> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        success: false,
        error: "GEMINI_API_KEY not configured",
      };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are analyzing a screenshot of a product page. Extract product information.

CRITICAL RULES - FOLLOW EXACTLY:
1. Return ONLY a valid JSON object with this exact structure:
   {
     "name": "Product Name" or null,
     "price": 19.99 or null
   }

2. Validation rules:
   - name: String containing the product name/title, or null if not visible
   - price: Number without currency symbol ($, €, etc.), or null if not visible

3. If you see both sale and original price, use the SALE PRICE (lower one)
4. Do NOT include any text before or after the JSON
5. Be precise - only extract what you clearly see in the screenshot
6. If the screenshot is unclear or not a product page, return nulls

EXAMPLES OF VALID RESPONSES:
{"name": "Sony WH-1000XM5 Headphones", "price": 349.99}
{"name": "Nike Air Max", "price": null}
{"name": null, "price": 99.99}
{"name": null, "price": null}

JSON RESPONSE:`;

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // Retry with backoff
    const result = await retryWithBackoff(async () => {
      const res = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
          },
        },
      ]);

      const text = res.response.text().trim();

      // Validate JSON response
      const data = extractAndValidateJSON<{
        name: string | null;
        price: number | null;
      }>(text, {
        name: "required",
        price: "required",
      });

      if (!data) {
        throw new Error("Invalid JSON response from Vision AI");
      }

      // Additional validation
      if (data.price && (isNaN(Number(data.price)) || Number(data.price) <= 0)) {
        console.warn("Invalid price from vision, setting to null");
        data.price = null;
      }

      return data;
    });

    return {
      success: true,
      name: result.name || undefined,
      price: result.price ? parseFloat(result.price.toString()) : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Vision AI failed",
    };
  }
}

/**
 * Clean HTML for LLM processing
 * Removes scripts, styles, and reduces noise
 */
function cleanHtmlForLLM(html: string): string {
  // Remove script and style tags
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Extract text content focusing on price-related sections
  const priceKeywords = [
    "price",
    "cost",
    "sale",
    "deal",
    "discount",
    "\\$",
    "USD",
  ];
  const priceRegex = new RegExp(
    `(${priceKeywords.join("|")}).*?\\$?[0-9,]+\\.\\d{2}`,
    "gi"
  );

  const priceMatches = cleaned.match(priceRegex);
  if (priceMatches) {
    // If we found price-related sections, focus on those
    cleaned = priceMatches.join("\n");
  }

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Limit to first 5000 characters to reduce token usage
  return cleaned.substring(0, 5000);
}

/**
 * Extract price using Google Gemini AI
 * Fallback for sites not supported by CSS selectors
 */
async function scrapePriceWithAI(url: string): Promise<PriceResult> {
  try {
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return {
        success: false,
        error: "GEMINI_API_KEY not configured",
      };
    }

    // Fetch the page
    const fetchResult = await fetchPage(url);

    if (!fetchResult.success || !fetchResult.html) {
      return { success: false, error: fetchResult.error || "Failed to fetch page" };
    }

    const html = fetchResult.html;
    const cleanedHtml = cleanHtmlForLLM(html);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prompt for price extraction with strict formatting
    const prompt = `You are a price extraction assistant. Extract the current selling price from this product page HTML.

CRITICAL RULES - FOLLOW EXACTLY:
1. Return ONLY a valid JSON object with this exact structure: {"price": NUMBER}
2. Example valid responses: {"price": 19.99} or {"price": 159.00}
3. If there's a sale price and original price, use the SALE PRICE
4. If out of stock or no price found, return: {"price": null}
5. Do NOT include any text before or after the JSON
6. Do NOT include currency symbols in the number
7. Use decimal format (e.g., 19.99 not 19)

HTML Content:
${cleanedHtml}

JSON RESPONSE:`;

    // Retry with backoff
    const result = await retryWithBackoff(async () => {
      const res = await model.generateContent(prompt);
      const text = res.response.text().trim();

      // Validate JSON response
      const data = extractAndValidateJSON<{ price: number | null }>(text, {
        price: "required",
      });

      if (!data) {
        throw new Error("Invalid JSON response from AI");
      }

      return data;
    });

    // Check if price was found
    if (result.price === null) {
      return {
        success: false,
        error: "No price found or out of stock",
      };
    }

    // Validate price value
    const price = parseFloat(result.price.toString());
    if (isNaN(price) || price <= 0) {
      return {
        success: false,
        error: "Invalid price value",
      };
    }

    return {
      success: true,
      price,
      currency: "USD",
      source: "ai-extracted",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI extraction failed",
    };
  }
}
