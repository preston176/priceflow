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
 * Extract price from Amazon product page
 */
async function scrapeAmazon(url: string): Promise<PriceResult> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch page" };
    }

    const html = await response.text();

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
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch page" };
    }

    const html = await response.text();

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
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch page" };
    }

    const html = await response.text();

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
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch page" };
    }

    const html = await response.text();

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
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch page" };
    }

    const html = await response.text();

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
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch page" };
    }

    const html = await response.text();

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

    const prompt = `You are a product information extraction assistant. Extract the following from this product page:

1. Product Name/Title
2. Main product image URL (full URL, not relative)
3. Current selling price (if there's a sale price, use that instead of original)

Return ONLY a JSON object in this exact format:
{
  "name": "Product Name Here",
  "imageUrl": "https://full-url-to-image.jpg",
  "price": 19.99
}

If any field is not found, use null for that field.
For the image URL, prefer og:image or the main product image.
For price, return only the number without currency symbol.

HTML Content:
${cleanedHtml}

Base URL: ${url}

JSON:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "Could not parse AI response" };
    }

    const data = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      name: data.name || undefined,
      imageUrl: data.imageUrl || undefined,
      price: data.price ? parseFloat(data.price) : undefined,
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

    const prompt = `You are analyzing a screenshot of a product page. Extract the following information:

1. Product Name/Title
2. Current Price (if there's both sale and original price, use the sale price)

Return ONLY a JSON object in this exact format:
{
  "name": "Product Name Here",
  "price": 19.99
}

If any field is not found, use null for that field.
For price, return only the number without currency symbol.
Be precise - only extract what you see clearly in the screenshot.

JSON:`;

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const text = result.response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "Could not parse AI response" };
    }

    const data = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      name: data.name || undefined,
      price: data.price ? parseFloat(data.price) : undefined,
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
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch page" };
    }

    const html = await response.text();
    const cleanedHtml = cleanHtmlForLLM(html);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prompt for price extraction
    const prompt = `You are a price extraction assistant. Extract the current selling price from this product page HTML.

RULES:
1. Return ONLY a numeric value (e.g., "19.99" or "159")
2. If there's a sale price and original price, return the SALE PRICE
3. If out of stock or no price found, return "NONE"
4. Do not include currency symbols or text
5. Use decimal format with 2 places if cents exist

HTML Content:
${cleanedHtml}

PRICE:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse the response
    if (text === "NONE" || text.toLowerCase().includes("out of stock")) {
      return {
        success: false,
        error: "No price found or out of stock",
      };
    }

    // Extract number from response
    const priceMatch = text.match(/([0-9]+\.?[0-9]*)/);
    if (!priceMatch) {
      return {
        success: false,
        error: "Could not parse price from AI response",
      };
    }

    const price = parseFloat(priceMatch[1]);
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
