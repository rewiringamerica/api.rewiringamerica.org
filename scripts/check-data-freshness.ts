import * as minimist from 'minimist';

async function checkUrlDataAvailability(link: string) {
    const axios = require('axios').default;
    const content = axios({
        method: 'get',
        url: link,
        timeout: 10000,
    })
    .catch((error: { response: { status: any; }; }) => {
        console.error(`${link} did not return a valid response. Instead, the response was:`, error);
        return undefined; 
    });
    content.then(function(result: any) {
        console.log(result.config.url, result.status);
    });
    return;
}


const isURLValid = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
};

(async function () {
    const args = minimist(process.argv.slice(2), {});

    const bad = args._.filter(url => !(isURLValid(url)));
    if (bad.length) {
        console.error(
        `${bad.join(', ')} is not a valid URL.`,
        );
        process.exit(1);
    }
    args._.forEach(async urls => {
      await checkUrlDataAvailability(urls);
    });
  })();