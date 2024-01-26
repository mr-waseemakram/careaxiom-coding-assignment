const http = require('http');
const url = require('url');
const request = require('request');
const async = require('async');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    if (parsedUrl.pathname === '/I/want/title/' && parsedUrl.query.address) {
        const addresses = Array.isArray(parsedUrl.query.address)
            ? parsedUrl.query.address
            : [parsedUrl.query.address];

        const titles = [];

        // Changed the forEach loop to use async.each
        async.each(addresses, (address, callback) => {
            // Check if the address already starts with 'http://' or 'https://'
            const modifiedAddress = address.startsWith('http://') || address.startsWith('https://')
                ? address // If it does, leave it as is
                : 'https://' + address; // If not, prepend 'https://'
            request({ url: modifiedAddress, method: 'GET' }, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    const titleMatch = body.match(/<title>(.*?)<\/title>/i);
                    const title = titleMatch ? titleMatch[1] : 'NO RESPONSE';
                    titles.push({ address, title });
                } else {
                    titles.push({ address, title: 'NO RESPONSE' });
                }
                callback(); // Call the callback to indicate completion of this iteration
            });
        }, (err) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            } else {
                sendResponse(res, titles);
            }
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
