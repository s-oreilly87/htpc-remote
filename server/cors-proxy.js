import express from 'express'
import cors from 'cors'
import {createProxyMiddleware} from 'http-proxy-middleware'

const proxyApp = express()
proxyApp.use(cors())
proxyApp.use(createProxyMiddleware({
    router: (req) => new URL(req.url.substring(1)),
    pathRewrite: (path, req) => {
        const splitUrl = req.url.substring(1).split("?")
        let url = new URL(splitUrl[0])

        let query
        if (splitUrl.length > 1) {
            query = splitUrl[1]
            return url.pathname + "?" + query
        }
        return url.pathname
    },
    changeOrigin: true,
    secure: false,
    logger: console,
}))

export default proxyApp
