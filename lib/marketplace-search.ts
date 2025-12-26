import { db } from "@/db";
import { marketplaceSearchCache } from "@/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";

export interface ProductSearchResult {
  name: string;
  price: number;
  url: string;
  imageUrl?: string;
  marketplace: string;
  inStock: boolean;
}

export interface MarketplaceSearchOptions {
  query: string;
  maxResults?: number; // Default 10
  useCache?: boolean; // Default true
  marketplaces?: string[]; // Filter specific marketplaces
}

export interface SearchResponse {
  results: ProductSearchResult[];
  errors: Record<string, string>;
  cached: boolean;
}

// CSS Selectors for each marketplace
const AMAZON_SELECTORS = {
  productCard: '[data-component-type="s-search-result"]',
  name: 'h2 a span',
  price: '.a-price .a-offscreen',
  link: 'h2 a',
  image: '.s-image',
};

const WALMART_SELECTORS = {
  productCard: '[data-item-id]',
  name: '[data-automation-id="product-title"]',
  price: '[data-automation-id="product-price"]',
  link: 'a[link-identifier="linkProductTitle"]',
  image: 'img[data-testid="productTileImage"]',
};

const TARGET_SELECTORS = {
  productCard: '[data-test="product-card"]',
  name: 'a[data-test="product-title"]',
  price: '[data-test="current-price"]',
  link: 'a[data-test="product-title"]',
  image: 'img[data-test="product-image"]',
};

const BESTBUY_SELECTORS = {
  productCard: '.sku-item',
  name: '.sku-title a',
  price: '.priceView-customer-price span',
  link: '.sku-title a',
  image: '.product-image img',
};

// Rate limiter to prevent too many requests
class RateLimiter {
  private queues: Map<string, Array<() => Promise<any>>> = new Map();
  private processing: Map<string, boolean> = new Map();
  private delayMs = 1000; // 1 second between requests

  async execute<T>(marketplace: string, task: () => Promise<T>): Promise<T> {
    if (!this.queues.has(marketplace)) {
      this.queues.set(marketplace, []);
      this.processing.set(marketplace, false);
    }

    return new Promise((resolve, reject) => {
      this.queues.get(marketplace)!.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue(marketplace);
    });
  }

  private async processQueue(marketplace: string) {
    if (this.processing.get(marketplace)) return;

    this.processing.set(marketplace, true);
    const queue = this.queues.get(marketplace)!;

    while (queue.length > 0) {
      const task = queue.shift()!;
      await task();
      if (queue.length > 0) {
        await this.delay(this.delayMs);
      }
    }

    this.processing.set(marketplace, false);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const rateLimiter = new RateLimiter();

/**
 * Get cached search results if available and not expired
 */
async function getCachedResults(
  query: string,
  marketplace: string
): Promise<ProductSearchResult[] | null> {
  try {
    const cached = await db
      .select()
      .from(marketplaceSearchCache)
      .where(
        and(
          eq(marketplaceSearchCache.searchQuery, query.toLowerCase()),
          eq(marketplaceSearchCache.marketplace, marketplace),
          gt(marketplaceSearchCache.expiresAt, new Date())
        )
      )
      .limit(1);

    if (cached.length > 0) {
      return JSON.parse(cached[0].results);
    }

    return null;
  } catch (error) {
    console.error("Error getting cached results:", error);
    return null;
  }
}

/**
 * Cache search results for 24 hours
 */
async function cacheSearchResults(
  query: string,
  marketplace: string,
  results: ProductSearchResult[]
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Delete existing cache for this query/marketplace
    await db
      .delete(marketplaceSearchCache)
      .where(
        and(
          eq(marketplaceSearchCache.searchQuery, query.toLowerCase()),
          eq(marketplaceSearchCache.marketplace, marketplace)
        )
      );

    // Insert new cache
    await db.insert(marketplaceSearchCache).values({
      searchQuery: query.toLowerCase(),
      marketplace,
      results: JSON.stringify(results),
      resultCount: results.length.toString(),
      expiresAt,
    });
  } catch (error) {
    console.error("Error caching results:", error);
  }
}

/**
 * Parse price from text (handles various formats like $19.99, 19.99, etc.)
 */
function parsePrice(priceText: string): number | null {
  const cleaned = priceText.replace(/[^0-9.]/g, "");
  const price = parseFloat(cleaned);
  return isNaN(price) ? null : price;
}

/**
 * Search Amazon using Product Advertising API
 * Requires: AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG
 */
async function searchAmazon(
  query: string,
  maxResults: number = 10
): Promise<ProductSearchResult[]> {
  return rateLimiter.execute("amazon", async () => {
    try {
      // Check if API credentials are configured
      if (!process.env.AMAZON_ACCESS_KEY || !process.env.AMAZON_SECRET_KEY) {
        console.warn("Amazon API credentials not configured. Skipping Amazon search.");
        return [];
      }

      // TODO: Implement Amazon Product Advertising API
      // For now, return empty array until credentials are set up
      console.log("Amazon API search not yet implemented - requires PA API setup");
      return [];
    } catch (error) {
      console.error("Amazon search error:", error);
      return [];
    }
  });
}

/**
 * Search Walmart using Open API
 * Requires: WALMART_API_KEY
 * Docs: https://developer.walmart.com/
 */
async function searchWalmart(
  query: string,
  maxResults: number = 10
): Promise<ProductSearchResult[]> {
  return rateLimiter.execute("walmart", async () => {
    try {
      if (!process.env.WALMART_API_KEY) {
        console.warn("Walmart API key not configured. Skipping Walmart search.");
        return [];
      }

      const searchUrl = `https://developer.api.walmart.com/api-proxy/service/affil/product/v2/search?query=${encodeURIComponent(query)}&numItems=${maxResults}`;

      const response = await fetch(searchUrl, {
        headers: {
          "WM_SEC.KEY_VERSION": "1",
          "WM_CONSUMER.ID": process.env.WALMART_API_KEY,
          "WM_QOS.CORRELATION_ID": Date.now().toString(),
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Walmart API failed: ${response.status}`);
      }

      const data = await response.json();
      const results: ProductSearchResult[] = [];

      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item: any) => {
          if (item.name && item.salePrice) {
            results.push({
              name: item.name,
              price: parseFloat(item.salePrice),
              url: item.productUrl || `https://www.walmart.com/ip/${item.itemId}`,
              imageUrl: item.thumbnailImage || item.mediumImage,
              marketplace: "walmart",
              inStock: item.stock === "Available",
            });
          }
        });
      }

      return results.slice(0, maxResults);
    } catch (error) {
      console.error("Walmart search error:", error);
      return [];
    }
  });
}

/**
 * Search Target - No official public API available
 * Target does not provide a public API for product search
 * Skipping Target for now
 */
async function searchTarget(
  query: string,
  maxResults: number = 10
): Promise<ProductSearchResult[]> {
  return rateLimiter.execute("target", async () => {
    try {
      console.warn("Target does not have a public API. Skipping Target search.");
      return [];
    } catch (error) {
      console.error("Target search error:", error);
      return [];
    }
  });
}

/**
 * Search Best Buy using Products API
 * Requires: BESTBUY_API_KEY
 * Signup: https://bestbuyapis.github.io/api-documentation/
 */
async function searchBestBuy(
  query: string,
  maxResults: number = 10
): Promise<ProductSearchResult[]> {
  return rateLimiter.execute("bestbuy", async () => {
    try {
      if (!process.env.BESTBUY_API_KEY) {
        console.warn("Best Buy API key not configured. Skipping Best Buy search.");
        return [];
      }

      const searchUrl = `https://api.bestbuy.com/v1/products((search=${encodeURIComponent(query)}))?apiKey=${process.env.BESTBUY_API_KEY}&sort=salePrice.asc&show=sku,name,salePrice,url,image,onlineAvailability&pageSize=${maxResults}&format=json`;

      const response = await fetch(searchUrl);

      if (!response.ok) {
        throw new Error(`Best Buy API failed: ${response.status}`);
      }

      const data = await response.json();
      const results: ProductSearchResult[] = [];

      if (data.products && Array.isArray(data.products)) {
        data.products.forEach((product: any) => {
          if (product.name && product.salePrice) {
            results.push({
              name: product.name,
              price: parseFloat(product.salePrice),
              url: product.url,
              imageUrl: product.image,
              marketplace: "bestbuy",
              inStock: product.onlineAvailability || false,
            });
          }
        });
      }

      return results;
    } catch (error) {
      console.error("Best Buy search error:", error);
      return [];
    }
  });
}

/**
 * Search using SerpAPI Google Shopping
 * This searches across all marketplaces in a single request
 */
async function searchWithSerpAPI(
  query: string,
  maxResults: number = 10
): Promise<ProductSearchResult[]> {
  try {
    if (!process.env.SERPAPI_KEY) {
      console.warn("SerpAPI key not configured.");
      return [];
    }

    const params = new URLSearchParams({
      engine: "google_shopping",
      q: query,
      api_key: process.env.SERPAPI_KEY,
      num: maxResults.toString(),
      hl: "en",
    });

    const url = `https://serpapi.com/search.json?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`SerpAPI failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const results: ProductSearchResult[] = [];

    if (data.shopping_results && Array.isArray(data.shopping_results)) {
      data.shopping_results.forEach((item: any) => {
        // Extract marketplace from source domain
        const source = item.source?.toLowerCase() || "";
        let marketplace = "other";

        if (source.includes("amazon")) marketplace = "amazon";
        else if (source.includes("walmart")) marketplace = "walmart";
        else if (source.includes("target")) marketplace = "target";
        else if (source.includes("bestbuy") || source.includes("best buy")) marketplace = "bestbuy";

        // Parse price from extracted_price or price string
        let price = 0;
        if (item.extracted_price) {
          price = parseFloat(item.extracted_price);
        } else if (item.price) {
          const priceNum = parsePrice(item.price);
          if (priceNum) price = priceNum;
        }

        if (item.title && price > 0) {
          results.push({
            name: item.title,
            price: price,
            url: item.link || item.product_link || "",
            imageUrl: item.thumbnail || item.image,
            marketplace: marketplace,
            inStock: true, // SerpAPI doesn't always provide stock info
          });
        }
      });
    }

    // Filter to only include major marketplaces
    const filtered = results.filter(r =>
      ["amazon", "walmart", "target", "bestbuy"].includes(r.marketplace)
    );

    // Sort by price (lowest first)
    filtered.sort((a, b) => a.price - b.price);

    return filtered.slice(0, maxResults);
  } catch (error) {
    console.error("❌ SerpAPI search error:", error);
    return [];
  }
}

/**
 * Generate demo/mock search results for testing
 */
function generateDemoResults(query: string, maxResults: number = 10): ProductSearchResult[] {
  const results: ProductSearchResult[] = [];
  const basePrice = 50 + Math.random() * 200; // Random base price between $50-$250

  const marketplaces = ["amazon", "walmart", "target", "bestbuy"];

  marketplaces.forEach((marketplace, idx) => {
    // Add slight price variation per marketplace
    const priceVariation = (Math.random() - 0.5) * 40; // ±$20
    const price = basePrice + priceVariation;

    results.push({
      name: `${query} - Premium Edition`,
      price: parseFloat(price.toFixed(2)),
      url: `https://www.${marketplace}.com/product/demo-${Date.now()}-${idx}`,
      imageUrl: `https://placehold.co/200x200/png?text=${marketplace}`,
      marketplace: marketplace,
      inStock: Math.random() > 0.2, // 80% chance in stock
    });
  });

  // Sort by price
  results.sort((a, b) => a.price - b.price);

  return results.slice(0, maxResults);
}

/**
 * Search all marketplaces in parallel
 */
export async function searchAllMarketplaces(
  options: MarketplaceSearchOptions
): Promise<SearchResponse> {
  const {
    query,
    maxResults = 10,
    useCache = true,
    marketplaces = ["amazon", "walmart", "target", "bestbuy"],
  } = options;

  // PRIORITY 1: Use SerpAPI if available (single API for all marketplaces)
  if (process.env.SERPAPI_KEY) {
    try {
      const results = await searchWithSerpAPI(query, maxResults);

      if (results.length > 0) {
        return {
          results,
          errors: {},
          cached: false,
        };
      }
    } catch (error) {
      console.error("SerpAPI error:", error);
    }
  }

  // PRIORITY 2: Check if individual marketplace API keys are configured
  const hasApiKeys =
    process.env.BESTBUY_API_KEY ||
    process.env.WALMART_API_KEY ||
    process.env.AMAZON_ACCESS_KEY;

  // PRIORITY 3: If no API keys at all, use demo data
  if (!hasApiKeys && !process.env.SERPAPI_KEY) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const demoResults = generateDemoResults(query, maxResults);

    return {
      results: demoResults,
      errors: {},
      cached: false,
    };
  }

  const errors: Record<string, string> = {};
  let allResults: ProductSearchResult[] = [];
  let cached = false;

  // Define search functions
  const searchFunctions: Record<string, (q: string, max: number) => Promise<ProductSearchResult[]>> = {
    amazon: searchAmazon,
    walmart: searchWalmart,
    target: searchTarget,
    bestbuy: searchBestBuy,
  };

  // Search each marketplace
  const searchPromises = marketplaces.map(async (marketplace) => {
    try {
      // Check cache first
      if (useCache) {
        const cachedResults = await getCachedResults(query, marketplace);
        if (cachedResults) {
          cached = true;
          return cachedResults;
        }
      }

      // Execute search
      const searchFn = searchFunctions[marketplace];
      if (!searchFn) {
        errors[marketplace] = "Unsupported marketplace";
        return [];
      }

      const results = await searchFn(query, maxResults);

      // Cache results
      if (useCache && results.length > 0) {
        await cacheSearchResults(query, marketplace, results);
      }

      return results;
    } catch (error) {
      errors[marketplace] = error instanceof Error ? error.message : "Search failed";
      return [];
    }
  });

  // Wait for all searches to complete
  const resultsArrays = await Promise.all(searchPromises);
  allResults = resultsArrays.flat();

  // Sort by price (lowest first)
  allResults.sort((a, b) => a.price - b.price);

  return {
    results: allResults,
    errors,
    cached,
  };
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
  try {
    const now = new Date();
    const result = await db
      .delete(marketplaceSearchCache)
      .where(lt(marketplaceSearchCache.expiresAt, now));

    return 0; // Can't get count from Drizzle delete
  } catch (error) {
    console.error("Error clearing expired cache:", error);
    return 0;
  }
}
