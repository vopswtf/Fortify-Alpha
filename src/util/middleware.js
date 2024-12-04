const jwt = require("jsonwebtoken");
const UserModel = require("../model/user");
const { getTokenByToken, deleteToken, DateAddHours } = require("./token");

async function verifyToken(req, res, next) {
    if (!req.headers.authorization || !req.headers.authorization.startsWith("bearer eg1~")) return res.status(401).json({ error: "invalid_token" });

    const token = req.headers.authorization.replace("bearer ", "").replace("eg1~", "");

    try {
        const decodedToken = jwt.decode(token);

        const accessToken = await getTokenByToken(`eg1~${token}`);
        if (!accessToken) throw new Error("Invalid token.");

        if (DateAddHours(new Date(decodedToken.creation_date), decodedToken.hours_expire).getTime() <= new Date().getTime()) {
            throw new Error("Expired access token.");
        }

        req.user = await UserModel.findOne({ accountId: decodedToken.sub }).lean();
        if (!req.user) throw new Error("Invalid user.");

        next();
    } catch (err) {
        console.log(err);
        const access = await getTokenByToken(`eg1~${token}`);
        if (access) await deleteToken("access", access.identifier);

        return res.status(401).json({ error: "invalid_token" });
    }
}


async function verifyClient(req, res, next) {
    if (!req.headers.authorization || !req.headers.authorization.startsWith("bearer eg1~")) return res.status(401).json({ error: "invalid_token" });

    const token = req.headers.authorization.replace("bearer eg1~", "");

    try {
        const decodedToken = jwt.decode(token);

        const accessToken = await getTokenByToken(`eg1~${token}`);
        const clientToken = await getTokenByToken(`eg1~${token}`);
        if (!accessToken && !clientToken) throw new Error("Invalid token.");

        if (DateAddHours(new Date(decodedToken.creation_date), decodedToken.hours_expire).getTime() <= new Date().getTime()) {
            throw new Error("Expired access/client token.");
        }

        next();
    } catch (err) {
        console.log("Error in verifyClient")
        console.log(err);
        const access = await getTokenByToken(`eg1~${token}`);
        if (access) await deleteToken("access", access.identifier);

        const client = await getTokenByToken(`eg1~${token}`);
        if (client) await deleteToken("client", client.identifier);

        return res.status(401).json({ error: "invalid_token" });
    }
}

module.exports = {
    verifyToken,
    verifyClient
}