import axios from 'axios';
import axiosRetry from 'axios-retry';
import pdf from 'pdf-parse';
import { test } from 'tap';
import { PROGRAMS } from '../src/data/programs';

// Returns the status obtained by trying to request the URL content.
async function checkUrlDataAvailability(
  link: string,
): Promise<number | undefined> {
  // Set the number of retries to 3 for network errors or those in the 5xx range.
  axiosRetry(axios, {
    retries: 3,
  });
  const content = await axios({
    method: 'get',
    url: link,
    timeout: 10000,
    validateStatus: () => true,
  }).catch(function (error) {
    // If a non-2xx response status exists, return it.
    if (error.response) {
      return error.response.status;
    }
    // If the request was made but no response was received, log the request.
    else if (error.request) {
      return undefined;
    } else {
      console.log('An error occurred for ', link, ': ', error.message);
      return undefined;
    }
  });
  return content.status;
}

// Returns the response data obtained by trying to request the URL content.
async function returnAvailablePdfUrlData(
  link: string,
): Promise<string | undefined> {
  // Set the number of retries to 3 for network errors or those in the 5xx range.
  axiosRetry(axios, {
    retries: 3,
  });
  const content = await axios({
    method: 'get',
    url: link,
    timeout: 10000,
    responseType: 'arraybuffer',
    validateStatus: () => true,
    headers: {
      'Content-Type': 'application/pdf',
    },
  }).catch(function (error) {
    // If a non-2xx response status exists, return it.
    if (error.response) {
      return error.response.status;
    }
    // If the request was made but no response was received, log the request.
    else if (error.request) {
      return undefined;
    } else {
      console.log('An error occurred for ', link, ': ', error.message);
      return undefined;
    }
  });
  const pdf_data = await pdf(content.data).then(function (data) {
    return data.text.toString();
  });
  return pdf_data;
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
        const status = await checkUrlDataAvailability(url_to_check);
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

test('PDF returned readable text, able to be parsed', async tap => {
  // Check that PDF link can be read and returned.
  // This PDF may oneday no longer exist, and if this test fails, the url should be checked first.
  const data = await returnAvailablePdfUrlData(
    'https://assets-partners.bouldercounty.gov/wp-content/uploads/sites/2/2023/08/Manufactured-Homes-Eligible-Measures-List-2023.pdf',
  );
  if (data === undefined || data === null || data === '') {
    tap.fail(
      'PDF link was unable to be read, data returned is undefined or empty.',
    );
  } else {
    tap.pass('Non-empty PDF data was returned.');
  }
});
