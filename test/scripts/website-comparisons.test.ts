import { test } from 'tap';
import {
  checkWebsiteAndReturnHash,
  cleanWebsiteData,
  isPdf,
} from '../../scripts/lib/website-comparisons';

test('Only HTML body and readable content is returned', tap => {
  const unclean_html: string =
    "<html> <head> <meta content='Incorrect to be shown'> <link as='style' href='/doc/assets/stylesheets/fonts-b49e8aae.css' rel='stylesheet'> <meta content='ie=edge' http-equiv='X-UA-Compatible'> </head> <body>Correct content<div> and div contents</div> </body> </html>";
  tap.equal(cleanWebsiteData(unclean_html), 'Correct content and div contents');
  tap.end();
});

test('If no body is present, and no readable html, an empty string is returned', tap => {
  const unclean_html: string =
    "<html> <head> <meta content='Incorrect to be shown'> <link as='style' href='/doc/assets/stylesheets/fonts-b49e8aae.css' rel='stylesheet'> <meta content='ie=edge' http-equiv='X-UA-Compatible'> </head></html>";
  tap.equal(cleanWebsiteData(unclean_html), '');
  tap.end();
});

test('PDF web link is treated as PDF', tap => {
  const pdf_link = 'https://fakelink.com/to_this.pdf';
  const pdf_html: string =
    '<html><title> Not indicating anything here </title></html>';
  tap.equal(isPdf(pdf_link, pdf_html), true);
  tap.end();
});

test('PDF content via pdf-viewer tag is considered PDF', tap => {
  const pdf_link = 'https://fakelink.com/no_indications';
  const pdf_html: string =
    '<html><title> Not indicating anything here </title> <body> But here <div type="application/pdf"> We see PDF </div> </body> </html>';
  tap.equal(isPdf(pdf_link, pdf_html), true);
  tap.end();
});

test('Non-PDF specific content is not considered PDF', tap => {
  const pdf_link = 'https://fakelink.com/no_indications';
  const pdf_html: string =
    '<html> <title> Not indicating anything here </title> <body> No PDF at all </body> </html>';
  tap.equal(isPdf(pdf_link, pdf_html), false);
  tap.end();
});

test('Create hash for valid website with body', tap => {
  const web_link = 'https://fakelink.com/no_indications';
  const web_html: string =
    '<html> <title> Title of website 1</title> <body> Body of website 1 </body> </html>';
  tap.equal(
    checkWebsiteAndReturnHash(web_link, web_html),
    'e817561b5357b10008ecddc87a81140aeba2fbf5d7b0927be70b4b2da1bddf6c',
  );
  tap.end();
});

test('For website with no html returned, return null', tap => {
  const web_link = 'https://fakelink.com/no_indications';
  const bad_web_html: string =
    "<html> <head> <meta content='Incorrect to be shown'> <link as='style' href='/doc/assets/stylesheets/fonts-b49e8aae.css' rel='stylesheet'> <meta content='ie=edge' http-equiv='X-UA-Compatible'> </head></html>";
  tap.equal(checkWebsiteAndReturnHash(web_link, bad_web_html), null);
  tap.end();
});

test('For website that is a PDF, return null', tap => {
  const web_link = 'https://fakelink.com/no_indications.pdf';
  const bad_web_html: string =
    "<html> <head> <meta content='Incorrect to be shown'> <link as='style' href='/doc/assets/stylesheets/fonts-b49e8aae.css' rel='stylesheet'> <meta content='ie=edge' http-equiv='X-UA-Compatible'> </head> </html>";
  tap.equal(checkWebsiteAndReturnHash(web_link, bad_web_html), null);
  tap.end();
});
