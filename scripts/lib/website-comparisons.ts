import * as cheerio from 'cheerio';

// Return and clean the HTML body portions of a returned website.
function cleanWebsiteData(response: string): string | null {
    const web_data = cheerio.load(response);
    // TODO: clean html to relevant information.
    if (web_data('body') !== null) {
    return web_data('body').html();
    }
    return web_data.html();
};

// Check whether a link is for a pdf or a website page.
function isPdf(link: string, response: string): boolean {
    if(link.endsWith('.pdf')) {
        return true;
    }
    // It is still possible a link is to a PDF, even if the URL doesn't end with pdf. For these, we check the object type.
    const web_data = cheerio.load(response);
    if(web_data('body')){
        if(web_data('pdf-viewer')){
            return true;
        }
    // Can add other tells of pdf-ness here.
    }
    // Otherwise, assume this is a normal website.
    return false;
}

// Given a website link and its html, return a hash of the cleaned website.

