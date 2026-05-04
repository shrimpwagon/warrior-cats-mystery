require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = parseInt(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, 'public');

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml; charset=utf-8',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const requestedPath = new URL(req.url, `http://${req.headers.host}`).pathname;
    const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(publicDir, safePath === '/' ? 'index.html' : safePath);

    if (!filePath.startsWith(publicDir)) {
        res.writeHead(403);
        res.end();
        return;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
        }

        const contentType = mimeTypes[path.extname(filePath)] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        if (req.method === 'HEAD') {
            res.end();
            return;
        }
        res.end(content);
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on 0.0.0.0:${port}`);
});
