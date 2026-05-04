require('dotenv').config();
const http = require('http');

const port = parseInt(process.env.PORT) || 3000;

const server = http.createServer((req, res) => {
    if (req.url === '/') {
        if (req.method === 'HEAD') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end();
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                message: 'Hello from Node.js!',
                project: process.env.APP_NAME || 'my-project'
            }));
        }
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on 0.0.0.0:${port}`);
});
