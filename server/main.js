import https from 'https'
import http from 'http'
import {parse} from 'url'
import fs from 'fs'
import next from 'next'
import proxyApp from './cors-proxy.js'
import denonApp from './denon.js'
import nutApp from './nutjs-server.js'

// ##########  HTPC Remote Next App  ##########
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost"
const nextAppPort = 4000;
const app = next({ dev, hostname, nextAppPort });

const credentialsNextApp = {
    key: fs.readFileSync('server/certificates/remote-app-key.pem'),
    cert: fs.readFileSync('server/certificates/remote-app-cert.pem')
};

app.prepare().then(() => {
    https.createServer(credentialsNextApp, (req, res) => {
        const parsedUrl = parse(req.url, true);
        const httpServer = http.createServer((req, res) => {
            // Call app.getRequestHandler with the httpServer object
            app.getRequestHandler()(req, res, parsedUrl);
        });
        // Pass the httpServer object to httpsServer's "request" event handler
        httpServer.emit("request", req, res);
    })
        .listen(nextAppPort, (err) => {
        if (err) throw err;
        console.log(`REMOTE-APP: ready - started server on url: https://${hostname}:${nextAppPort}`)
    });
});


// ##########  Cors Proxy Server  ##########
const proxyAppPort = 4001
const credentialsProxyApp = {
    key: fs.readFileSync('server/certificates/cors-proxy-key.pem'),
    cert: fs.readFileSync('server/certificates/cors-proxy-cert.pem')
};

https.createServer(credentialsProxyApp, proxyApp)
    .listen(proxyAppPort, () => {
        console.info(`CORS_PROXY: server started on port ${proxyAppPort}`)
    })


// ##########  NutJS Server  ##########
const nutAppPort = 4004
const credentialsNutApp = {
    key: fs.readFileSync('server/certificates/robot-key.pem'),
    cert: fs.readFileSync('server/certificates/robot-cert.pem')
}

https.createServer(credentialsNutApp, nutApp)
    .listen(nutAppPort, () => {
        console.info(`NUTJS: server started on port ${nutAppPort}`)
    })


// ##########  Denon Telnet Server  ##########
const denonAppPort = 4003
const credentialsDenonApp = {
    key: fs.readFileSync("server/certificates/denon-server-key.pem"),
    cert: fs.readFileSync("server/certificates/denon-server-cert.pem"),
}

https.createServer(credentialsDenonApp, denonApp)
    .listen(denonAppPort, () => {
    console.info(`DENON_TELNET: server started on port ${denonAppPort}`)
})


// https.createServer(credentialsDenonApp, denonApp)
//     .listen(denonAppPort, () => {
//     console.info(`DENON_TELNET: server started on port ${denonAppPort}`)
// })

