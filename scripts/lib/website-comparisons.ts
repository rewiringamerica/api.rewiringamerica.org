import * as cheerio from 'cheerio';
import { createHash } from 'node:crypto';

// Return and clean the HTML body portions of a returned website.
export function cleanWebsiteData(response: string): string {
  const $ = cheerio.load(response);
  // Only check for the HTML body to try and avoid metadata and scripts that may change per-system/call.
  if ($('body').length > 0) {
    // If <p> tags exist, try to only return those, as they'll likely be relevant tags.
    if($('p').length > 0) {
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

// Given a website link and its html, return a hash of the cleaned website. Do not return a hash if the site is for a PDF.
export function checkWebsiteAndReturnHash(
  link: string,
  response: string,
): string | null {
  if (isPdf(link, response)) {
    return null;
  }
  const cleaned_html = cleanWebsiteData(response);
  if (cleaned_html !== null && cleaned_html !== '') {
    const hash = createHash('sha256');
    hash.update(cleaned_html);
    return hash.digest('hex');
  }
  return null;
}
