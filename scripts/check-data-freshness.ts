import axios from 'axios';
import axiosRetry from 'axios-retry';
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
  }).catch(function (error) {
    // If a non-2xx response status exists, return it.
    if (error.response) {
      /**
      console.log(
        source,
        ' has an non-OK status code of: ',
        error.response.status,
        'with URL',
        link,
      );
      */
      return error.response.status;
    }
    // If the request was made but no response was received, log the request.
    else if (error.request) {
      /*
      console.log(
        'Request was made to',
        source,
        ' but no response received. The request was: ',
        error.request,
      );
      */
      return undefined;
    } else {
      /*console.log('An error occurred for ', source, ': ', error.message);*/
      return undefined;
    }
  });
  return content.status;
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
