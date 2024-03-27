import * as cheerio from 'cheerio';
import { createHash } from 'node:crypto';

// Return and clean the HTML body portions of a returned website.
export function cleanWebsiteData(response: string): string {
  const $ = cheerio.load(response);
  // Only check for the HTML body to try and avoid metadata and scripts that may change per-system/call.
  if ($('body').length > 0) {
    // If <p> tags exist, try to only return those, as they'll likely be relevant tags.
    if ($('p').length > 0) {
      // All contents in any <p> sections get concatenated together in a string, and have whitespace removed from start/end.
      return $('p').contents().text().trim();
    }
    return $('body').contents().text().trim();
  }
  // If the website does not have a body tag, return all found html (for now).
  return $.html().trim();
}

// Check whether a link is for a pdf or a website page.
export function isPdf(link: string, response: string): boolean {
  if (link.endsWith('.pdf')) {
    return true;
  }
  // It is still possible a link is to a PDF, even if the URL doesn't end with pdf. For these, we check the object type.
  const $ = cheerio.load(response);
  if ($('body').length > 0) {
    if ($('[type="application/pdf"]').length > 0) {
      return true;
    }
  }
  // Otherwise, assume this is a normal website.
  return false;
}

// Given a website link and its data, return a hash of the cleaned website. If it's a PDF, attempt to convert to readable text first.
export function checkWebsiteAndReturnHash(
  link: string,
  response: string,
): string | null {
  const hash = createHash('sha256');
  if (isPdf(link, response)) {
    // This "response" is actually pre-parsed PDF text, via 'returnAvailablePdfUrlData', so can skip cleaning and just update hash.
    hash.update(response);
    return hash.digest('hex');
  }
  const cleaned_html = cleanWebsiteData(response);
  if (cleaned_html !== null && cleaned_html !== '') {
    hash.update(cleaned_html);
    return hash.digest('hex');
  }
  return null;
}
