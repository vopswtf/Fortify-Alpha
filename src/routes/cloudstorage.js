const UserModel = require('../model/user');
const { verifyToken } = require('../util/middleware');
const buffer = require('buffer');
const pako = require('pako');
const crypto = require('crypto');

function getRawBody(req, res, next) {
    if (req.headers["content-length"]) {
        if (Number(req.headers["content-length"]) >= 400000) return res.status(403).json({ "error": "File size must be less than 400kb." });
    }

    try {
        req.rawBody = "";
        req.setEncoding("latin1");

        req.on("data", (chunk) => req.rawBody += chunk);
        req.on("end", () => next());
    } catch (err) {
        console.log(err);
        return res.status(403).json({ "error": "Invalid file." });
    }
}

function compress(data) {
    try {
        return Buffer.from(pako.deflate(data)).toString('base64');
    } catch (err) {
        return "";
    }
}

function decompress(data) {
    try {
        return pako.inflate(Buffer.from(data, 'base64'), { to: 'string' });
    } catch (err) {
        return "";
    }
}

module.exports = (app) => {
    app.get("/fortnite/api/cloudstorage/user/:accountId", verifyToken, (req, res) => {
        req.user.cloudStorage = req.user.cloudStorage || {};
    
        const CloudFiles = [];
    
        for (const file in req.user.cloudStorage) {
            CloudFiles.push({
                "uniqueFilename": file,
                "filename": file,
                "hash": req.user.cloudStorage[file].hash,
                "hash256": req.user.cloudStorage[file].hash256,
                "length": req.user.cloudStorage[file].length,
                "contentType": "application/octet-stream",
                "uploaded": req.user.cloudStorage[file].updated,
                "storageType": "S3",
                "storageIds": {},
                "accountId": req.user.accountId,
                "doNotCache": false
            });
        }
    
        return res.json(CloudFiles);
    });

    app.get("/fortnite/api/cloudstorage/user/*/:file", verifyToken, async (req, res) => {
        const file = req.params.file;
    
        if (!req.user.cloudStorage[file]) return res.status(200).end();
    
        res.setHeader("Content-Type", "application/octet-stream; charset=iso-8859-1");
    
        const contentBuffer = Buffer.from(decompress(req.user.cloudStorage[file].content), "latin1");
        res.send(contentBuffer);
    });
    
    app.put("/fortnite/api/cloudstorage/user/*/:file", verifyToken, getRawBody, async (req, res) => {
        if (Buffer.byteLength(req.rawBody) >= 400000) return res.status(403).json({ "error": "File size must be less than 400kb." });
        const fileName = req.params.file;
    
        const latin1Buffer = buffer.transcode(Buffer.from(req.rawBody), "utf8", "latin1");
        const latin1String = compress(latin1Buffer.toString("latin1"));
    
        if (!req.user.cloudStorage) req.user.cloudStorage = {};
    
        req.user.cloudStorage[fileName] = {
            content: latin1String,
            updated: new Date().toISOString(),
            hash: crypto.createHash('sha1').update(latin1String).digest('hex'),
            hash256: crypto.createHash('sha256').update(latin1String).digest('hex'),
            length: Buffer.byteLength(latin1String),
        }
    
        await UserModel.updateOne({ accountId: req.user.accountId }, { $set: { cloudStorage: req.user.cloudStorage } });
    
        res.status(204).end();
    });

    app.delete("/fortnite/api/cloudstorage/user/*/:file", verifyToken, async (req, res) => {
        const fileName = req.params.file;
    
        delete req.user.cloudStorage[fileName];
    
        await UserModel.updateOne({ accountId: req.user.accountId }, { $set: { cloudStorage: req.user.cloudStorage } });
    
        res.status(200).end();
    });
};