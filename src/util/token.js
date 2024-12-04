const AuthTokenModel = require('../model/authToken');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const createClient = async (clientId, grant_type, ip, expiresIn) => {
    const clientToken = jwt.sign({
        "p": Buffer.from(crypto.randomUUID()).toString("base64"),
        "clsvc": "fortnite",
        "t": "s",
        "mver": false,
        "clid": clientId,
        "ic": true,
        "am": grant_type,
        "jti": crypto.randomUUID().replace(/-/ig, ""),
        "creation_date": new Date(),
        "hours_expire": expiresIn
    }, process.env.JWT_SECRET, { expiresIn: `${expiresIn}h` });

    createToken("client", ip, `eg1~${clientToken}`);

    return clientToken;
}


const createAccess = async (user, clientId, grant_type, deviceId, expiresIn) => {
    const accessToken = jwt.sign({
        "app": "fortnite",
        "sub": user.accountId,
        "dvid": deviceId,
        "mver": false,
        "clid": clientId,
        "dn": user.username,
        "am": grant_type,
        "p": Buffer.from(crypto.randomUUID()).toString("base64"),
        "iai": user.accountId,
        "sec": 1,
        "clsvc": "fortnite",
        "t": "s",
        "ic": true,
        "jti": crypto.randomUUID().replace(/-/ig, ""),
        "creation_date": new Date(),
        "hours_expire": expiresIn
    }, process.env.JWT_SECRET, { expiresIn: `${expiresIn}h` });

    await createToken("access", user.accountId, `eg1~${accessToken}`);

    return accessToken;
}

const createRefresh = async (user, clientId, grant_type, deviceId, expiresIn) => {
    const refreshToken = jwt.sign({
        "sub": user.accountId,
        "dvid": deviceId,
        "t": "r",
        "clid": clientId,
        "am": grant_type,
        "jti": crypto.randomUUID().replace(/-/ig, ""),
        "creation_date": new Date(),
        "hours_expire": expiresIn
    }, process.env.JWT_SECRET, { expiresIn: `${expiresIn}h` });

    await createToken("refresh", user.accountId, `eg1~${refreshToken}`);

    return refreshToken;
}

const createToken = async (type, identifier, token) => {
    const authToken = new AuthTokenModel({
        identifier,
        type,
        token
    });

    await authToken.save();
};

const getTokenById = async (type, identifier) => {
    const authToken = await AuthTokenModel.findOne({ type, identifier });
    return authToken;
}

const getTokenByToken = async (token) => {
    const authToken = await AuthTokenModel.findOne({ token });
    return authToken;
}

const deleteToken = async (type, identifier) => {
    await AuthTokenModel.deleteOne({ type, identifier });
}

const deleteAnyExpiredTokens = async () => {
    const authTokens = await AuthTokenModel.find();

    for (const authToken of authTokens) {
        const decodedToken = jwt.decode(authToken.token.replace("eg1~", ""));

        if (DateAddHours(new Date(decodedToken.creation_date), decodedToken.hours_expire).getTime() <= new Date().getTime()) {
            await AuthTokenModel.deleteOne({ token: authToken.token });
        }
    }
}

function DateAddHours(pdate, number) {
    const date = pdate;
    date.setHours(date.getHours() + number);

    return date;
}

module.exports = {
    createToken,
    getTokenById,
    getTokenByToken,
    deleteToken,
    deleteAnyExpiredTokens,
    createClient,
    DateAddHours,
    createAccess,
    createRefresh
};