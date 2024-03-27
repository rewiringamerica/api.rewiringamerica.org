import axios, { AxiosError, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { test } from 'tap';
import { PROGRAMS } from '../src/data/programs';

// Returns URL data, with additional parameters added if the URL is pointed to a PDF.
async function returnAvailableUrlData(
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

const isURLValid = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

test('All URLs linking to current programs have an OK response code', async tap => {
  // Check each program to see whether it contains a URL. Check that the URL is valid, and then request the URL page.
  // For now, we're only checking the english URL for validity and an OK response.
  // URLs should all be valid, as there is a test to check for validity each time a new program is added.
  for (const [key, value] of Object.entries(PROGRAMS)) {
    if (Object.prototype.hasOwnProperty.call(value, 'url')) {
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const url_to_check = (value as any).url.en;
      if (!isURLValid(url_to_check)) {
        console.error('${url_to_check} is not a valid URL for program: ', key);
        process.exit(1);
      } else {
        const response = await returnAvailableUrlData(
          url_to_check,
          url_to_check.endsWith('.pdf'),
        );
        if (response?.data === undefined || response.data === null) {
          tap.fail(
            'Website returned no data from link: ' +
              url_to_check +
              ' for: ' +
              key,
          );
        }
        const status = response ? response.status : null;
        if (status === undefined || status === null) {
          tap.fail(
            'No status code was found when checking ' +
              url_to_check +
              ' for: ' +
              key,
          );
        } else if (status >= 200 && status <= 299) {
          tap.pass(key + ' returned an OK status code');
        } // Temporary condition check for 403 status code. This is due to Cloudflare security measures (at least for Efficiency Vermont's case), and should be noted, but not necessarily failed.
        else if (status === 403) {
          tap.pass(
            key +
              'returned a 403 status code. This is likely a Cloudflare security denial, and the website should be manually checked.',
          );
          console.log('403 error occurred for: ', key);
        } else {
          tap.fail(
            'Non-OK status code obtained for ' +
              url_to_check +
              ' for program: ' +
              key +
              'It was: ' +
              status,
          );
        }
      }
    } else {
      console.log('No URL found for: ', key, '. Value was: ', value);
    }
  }
});
