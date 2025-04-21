const UserModel = require('../model/user');
const { createClient, createToken, createAccess, getTokenById, deleteToken, DateAddHours, createRefresh, getTokenByToken } = require('../util/token');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ProfileModel = require('../model/profile');
const quests = require('../util/quests');
const { getAllItems, generateAttributes, getItem, getItemsStartingWith } = require('../util/gameData');
const ProfileWrapper = require('../util/ProfileWrapper');

const createUser = async (username, password, isDedicated = false) => {
    const user = new UserModel({
        accountId: crypto.randomUUID().replace(/-/ig, ""),
        username,
        password: await bcrypt.hash(password, 10),
        isDedicated,
    });
    await user.save();

    return user;
};

const createProfiles = async (user) => {
    const profile0 = new ProfileModel({ accountId: user.accountId, profileId: "profile0" });
    const wrapper = new ProfileWrapper(profile0);


    const guid = quests.addQuest(profile0, "Quest.homebaseonboarding");
    profile0.items[guid].attributes.completion_hbonboarding_completezone = 1;
    profile0.items[guid].attributes.completion_hbonboarding_watchsatellitecine = 1;

    quests.addQuest(profile0, "Quest.outpostquest_t1_l1");
    //quests.completeQuest(profile0, "Quest.outpostquest_t1_l1");

    // TODO: look into buildings more, i doubt each one is suppose to be added like this
    getAllItems("MyFortBuilding").forEach(item => {
        const attributes = generateAttributes(item.templateId);
        attributes.buildingState = "CanBuild";

        if (item.Name === "Building_CommandCenter") {
            attributes.level = 1;
            attributes.buildingState = "Idle";
        }

        wrapper.addItem({
            templateId: item.templateId,
            attributes: attributes,
            quantity: 1
        });
    })

    getAllItems("Currency").forEach(item => {
        wrapper.addItem({
            templateId: item.templateId,
            attributes: generateAttributes(item.templateId),
            quantity: 100000
        })
    })

    getAllItems("Schematic").forEach(item => {
        wrapper.addItem({
            templateId: item.templateId,
            attributes: generateAttributes(item.templateId),
            quantity: 1
        })
    })

    getAllItems("AccountResource").forEach(item => {
        wrapper.addItem({
            templateId: item.templateId,
            attributes: generateAttributes(item.templateId),
            quantity: 100000
        })
    })

    getAllItems("Resource").forEach(item => {
        wrapper.addItem({
            templateId: item.templateId,
            attributes: generateAttributes(item.templateId),
            quantity: 100000
        })
    })


    getAllItems("Trap").forEach(item => {
        wrapper.addItem({
            templateId: item.templateId,
            attributes: generateAttributes(item.templateId),
            quantity: 5
        })
    })

    getAllItems("Ingredient").forEach(item => {
        wrapper.addItem({
            templateId: item.templateId,
            attributes: generateAttributes(item.templateId),
            quantity: 100000
        })
    })

    getAllItems("Token").forEach(item => {
        wrapper.addItem({
            templateId: item.templateId,
            attributes: generateAttributes(item.templateId),
            quantity: 10000
        })
    })

    getAllItems("Weapon").forEach(item => {
        wrapper.addItem({
            templateId: item.templateId,
            attributes: generateAttributes(item.templateId),
            quantity: 10000
        })
    })

    getAllItems("Worker").forEach(item => {
        wrapper.addItem({
            templateId: item.templateId,
            attributes: generateAttributes(item.templateId),
            quantity: 1
        })
    })

    await profile0.save();
}

module.exports = (app) => {
    app.post('/account/api/oauth/token', async (req, res) => {
        let clientId;
        try {
            clientId = Buffer.from(req.headers.authorization.split(" ")[1], "base64").toString("utf-8").split(":")
            if (!clientId[1]) throw new Error("invalid client id");

            clientId = clientId[0];
        } catch {
            return res.status(400).send("invalid client id");
        }

        switch (req.body.grant_type) {
            case "exchange_code": 
                if (process.env.DEDICATED_EXCHANGE_CODE !== req.body.exchange_code) return res.status(401).json({ error: "invalid_auth" });

                req.user = await UserModel.findOne({ username: "DedicatedServer" }).lean();

                if (!req.user) {
                    req.user = await createUser("DedicatedServer", process.env.DEDICATED_EXCHANGE_CODE, true);
                    await createProfiles(req.user);
                }
                break;
            case "client_credentials":
                const ip = req.ip;

                const clientToken = await getTokenById("client", ip);
                if (clientToken) await deleteToken("client", ip);

                const token = await createClient(clientId, req.body.grant_type, ip, 4); // expires in 4 hours
                const decodedClient = jwt.decode(token);

                res.json({
                    access_token: `eg1~${token}`,
                    expires_in: Math.round(((DateAddHours(new Date(decodedClient.creation_date), decodedClient.hours_expire).getTime()) - (new Date().getTime())) / 1000),
                    expires_at: DateAddHours(new Date(decodedClient.creation_date), decodedClient.hours_expire).toISOString(),
                    token_type: "bearer",
                    client_id: clientId,
                    internal_client: true,
                    client_service: "fortnite"
                });
                return;
            case "password":
                const email = req.body.username;
                const password = req.body.password;
                if (!email || !password) return res.status(400).json({ error: "invalid_request" });

                const username = email.split("@")[0];

                req.user = await UserModel.findOne({ username });

                if (!req.user) {
                    req.user = await createUser(username, password);
                    await createProfiles(req.user);
                }

                if (email.endsWith("@reset.me")) {
                    await ProfileModel.deleteMany({ accountId: req.user.accountId });
                    await createProfiles(req.user);
                }

                if (!await bcrypt.compare(password, req.user.password)) return res.status(401).json({ error: "invalid_auth" });
                break;
            case "refresh_token":
                if (!req.body.refresh_token) return res.status(400).json({ error: "invalid_request" });

                const refresh_token = req.body.refresh_token;
                const refreshToken = await getTokenByToken(refresh_token);

                try {
                    if (!refreshToken) throw new Error("Refresh token invalid.");
                    const decodedRefreshToken = jwt.decode(refresh_token.replace("eg1~", ""));

                    if (DateAddHours(new Date(decodedRefreshToken.creation_date), decodedRefreshToken.hours_expire).getTime() <= new Date().getTime()) {
                        throw new Error("Expired refresh token.");
                    }
                } catch {
                    if (refreshToken) await deleteToken("refresh", refreshToken.identifier);
                    return res.status(401).json({ error: "failed_refresh" });
                }

                req.user = await UserModel.findOne({ accountId: refreshToken.identifier }).lean();
                break;
            default:
                return res.status(400).json({ error: "invalid_request" });
        }

        if (!req.user) return res.status(401).json({ error: "invalid_auth" });

        const deviceId = crypto.randomUUID().replace(/-/ig, "");

        await deleteToken("refresh", req.user.accountId);
        await deleteToken("access", req.user.accountId);

        let accessToken = await createAccess(req.user, clientId, req.body.grant_type, deviceId, 8); // expires in 8 hours
        let refreshToken = await createRefresh(req.user, clientId, req.body.grant_type, deviceId, 24); // expires in 24 hours

        const decodedAccess = jwt.decode(accessToken);
        const decodedRefresh = jwt.decode(refreshToken);

        res.json({
            access_token: `eg1~${accessToken}`,
            expires_in: Math.round(((DateAddHours(new Date(decodedAccess.creation_date), decodedAccess.hours_expire).getTime()) - (new Date().getTime())) / 1000),
            expires_at: DateAddHours(new Date(decodedAccess.creation_date), decodedAccess.hours_expire).toISOString(),
            token_type: "bearer",
            refresh_token: `eg1~${refreshToken}`,
            refresh_expires: Math.round(((DateAddHours(new Date(decodedRefresh.creation_date), decodedRefresh.hours_expire).getTime()) - (new Date().getTime())) / 1000),
            refresh_expires_at: DateAddHours(new Date(decodedRefresh.creation_date), decodedRefresh.hours_expire).toISOString(),
            account_id: req.user.accountId,
            client_id: clientId,
            internal_client: true,
            client_service: "fortnite",
            displayName: req.user.username,
            app: "fortnite",
            in_app_id: req.user.accountId,
            device_id: deviceId
        });
    });

    app.get("/account/api/oauth/verify", async (req, res) => {
        const token = req.headers.authorization.replace("bearer ", "");
        const decodedToken = jwt.decode(token.replace("eg1~", ""));

        const serverToken = await getTokenByToken(token);
        if (!serverToken) return res.status(401).json({ error: "invalid_token" });

        if (DateAddHours(new Date(decodedToken.creation_date), decodedToken.hours_expire).getTime() <= new Date().getTime()) {
            await deleteToken(serverToken.type, serverToken.identifier);
            return res.status(401).json({ error: "expired_token" });
        }

        const verification = {
            token,
            session_id: decodedToken.jti,
            token_type: "bearer",
            client_id: decodedToken.clid,
            internal_client: true,
            client_service: "fortnite",
            expires_in: Math.round(((DateAddHours(new Date(decodedToken.creation_date), decodedToken.hours_expire).getTime()) - (new Date().getTime())) / 1000),
            expires_at: DateAddHours(new Date(decodedToken.creation_date), decodedToken.hours_expire).toISOString(),
            auth_method: decodedToken.am,
            app: "fortnite",
            device_id: decodedToken.dvid
        }

        if (serverToken.type === "access" || serverToken.type === "refresh") {
            const user = await UserModel.findOne({ accountId: serverToken.identifier }).lean();
            if (user) {
                verification.account_id = user.accountId;
                verification.display_name = user.username;
                verification.in_app_id = user.accountId;
            }
        };

        res.json(verification);
    });

    app.delete("/account/api/oauth/sessions/kill", (req, res) => {
        res.status(204).send();
    });

    app.delete("/account/api/oauth/sessions/kill/:token", async (req, res) => {
        const token = req.params.token;

        const accessToken = await getTokenByToken(token);

        if (accessToken) {
            await deleteToken("refresh", accessToken.identifier);
            await deleteToken("access", accessToken.identifier);
        }


        const clientToken = await getTokenByToken(token);
        if (clientToken) await deleteToken("client", clientToken.identifier);

        res.status(204).end();
    });
};
