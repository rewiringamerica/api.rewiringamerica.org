import axios, { AxiosError, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import * as cheerio from 'cheerio';
import { createHash } from 'node:crypto';

// Returns URL data, with additional parameters added if the URL is pointed to a PDF.
export async function returnAvailableUrlData(
  link: string,
  is_pdf: boolean = false,
): Promise<AxiosResponse | undefined> {
  // Set the number of retries to 3 for network errors.
  axiosRetry(axios, {
    retries: 3,
  });
  return axios({
    method: 'get',
    url: link,
    timeout: 10000,
    headers: is_pdf
      ? {
          'Content-Type': 'application/pdf',
        }
      : {},
    responseType: is_pdf ? 'arraybuffer' : 'json',
    validateStatus: () => true,
  })
    .then(content => {
      return content;
    })
    .catch(function (error: AxiosError) {
      // If a non-2xx response status exists, return it.
      if (error.response) {
        return error.response;
      }
      // If the request was made but no response was received, log the request.
      else if (error.request) {
        return undefined;
      } else {
        console.log('An error occurred for ', link, ': ', error.message);
        return undefined;
      }
    });
}

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
  // It is still possible a link is to a PDF, even if the URL doesn't end with '.pdf'. For these, we check the object type.
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
