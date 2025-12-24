/**
 * Price Scraping Service
 * Extracts prices from product URLs for major retailers
 * Uses best-effort HTML parsing - gracefully handles failures
 */

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

    // Route to appropriate scraper based on domain
    if (hostname.includes("amazon.com")) {
      return await scrapeAmazon(url);
    } else if (hostname.includes("walmart.com")) {
      return await scrapeWalmart(url);
    } else if (hostname.includes("target.com")) {
      return await scrapeTarget(url);
    } else if (hostname.includes("bestbuy.com")) {
      return await scrapeBestBuy(url);
    } else {
      // Generic scraper for other sites
      return await scrapeGeneric(url);
    }
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
