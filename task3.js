const http = require('http');
const url = require('url');
const axios = require('axios'); // Using Axios for Promise-based HTTP requests

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/I/want/title/' && parsedUrl.query.address) {
    const addresses = Array.isArray(parsedUrl.query.address)
      ? parsedUrl.query.address
      : [parsedUrl.query.address];

    Promise.all(
      addresses.map(async address => {
        try {
          // Check if the address already starts with 'http://' or 'https://'
          const modifiedAddress = address.startsWith('http://') || address.startsWith('https://')
          ? address // If it does, leave it as is
          : 'https://' + address; // If not, prepend 'https://'
          const response = await axios.get(modifiedAddress);
          const titleMatch = response.data.match(/<title>(.*?)<\/title>/i);
          const title = titleMatch ? titleMatch[1] : 'NO RESPONSE';
          return { address, title };
        } catch (error) {
          return { address, title: 'NO RESPONSE' };
        }
      })
    )
      .then(titles => {
        sendResponse(res, titles);
      })
      .catch(error => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

function sendResponse(res, titles) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<html><head></head><body><h1>Following are the titles of given websites:</h1><ul>');

    titles.forEach(({ address, title }) => {
        res.write(`<li>${address} - "${title}"</li>`);
    });

    res.write('</ul></body></html>');
    res.end();
}

server.listen(port, hostname, () => {
    console.log(`Server listening on http://${hostname}:${port}/`);
});
