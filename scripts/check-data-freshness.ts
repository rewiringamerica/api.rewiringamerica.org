import { test } from 'tap';
import { PROGRAMS } from '../src/data/programs';
import { checkUrlDataAvailability } from './lib/website-comparisons';

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
