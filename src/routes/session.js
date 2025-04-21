const SessionModel = require("../model/sessions");
const { verifyToken, verifyDedicated } = require('../util/middleware');

module.exports = (app) => {
    // Add Session
    app.post("/fortnite/api/matchmaking/session", verifyToken, verifyDedicated, async (req, res) => {
        const session = req.body;
    
        session.id = crypto.randomUUID().replace(/-/g, "").toLowerCase();
        session.serverAddress = process.env.LOCALHOST_SESSIONS ? "127.0.0.1" : req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        session.lastUpdated = new Date().toISOString();
        session.started = false;
    
        const sessionModel = new SessionModel(session);
        await sessionModel.save();

        res.json(session);
    });

    // Start Session
    app.post("/fortnite/api/matchmaking/session/:sessionId/start", verifyToken, verifyDedicated, async (req, res) => {
        const session = await getSession(req.params.sessionId);
        if (!session) return res.status(404).end();
        
        session.started = true;
        session.lastUpdated = new Date().toISOString();
        await session.save();

        res.status(204).end();
    });

    // Get Session
    app.get("/fortnite/api/matchmaking/session/:sessionId", verifyToken, async (req, res) => {
        const session = await getSession(req.params.sessionId);
        if (!session) return res.status(404).end();
    
        res.json(session);
    });

    // Update Session
    app.put("/fortnite/api/matchmaking/session/:sessionId", verifyToken, verifyDedicated, async (req, res) => {
        const session = await getSession(req.params.sessionId);
        if (!session) return res.status(404).end();

        const updatedSession = req.body;

        // for athena u would update the other one but this is ot lol
        session.attributes = updatedSession.attributes;
        session.lastUpdated = new Date().toISOString();

        await session.save();
        res.json(session);
    });

    // Delete Session
    app.delete("/fortnite/api/matchmaking/session/:sessionId", verifyToken, verifyDedicated, async (req, res) => {
        const session = await getSession(req.params.sessionId);
        if (!session) return res.status(404).end();
    
        await session.deleteOne();

        res.status(204).end();
    });

    // Heartbeat
    app.post("/fortnite/api/matchmaking/session/:sessionId/heartbeat", verifyToken, verifyDedicated, async (req, res) => {
        const session = await getSession(req.params.sessionId);
        if (!session) return res.status(404).end();

        session.lastUpdated = new Date().toISOString();
        await session.save();

        res.status(204).end();
    });

    // Stop Session
    app.post("/fortnite/api/matchmaking/session/:sessionId/stop", verifyToken, verifyDedicated, async (req, res) => {
        const session = await getSession(req.params.sessionId);
        if (!session) return res.status(404).end();

        session.started = false;
        session.lastUpdated = new Date().toISOString();

        await session.save();
        res.status(204).end();
    });

    // Matchmaking
    app.post("/fortnite/api/matchmaking/session/matchMakingRequest", verifyToken, async (req, res) => {
        const criteria = req.body;
        if (!criteria) return res.status(400).end();
    
        const availableSessions = await matchMakingRequest(criteria);
    
        // prioritize localhost sessions
        availableSessions.sort((a, b) => {
            if (a.serverAddress === "127.0.0.1") return -1;
            if (b.serverAddress === "127.0.0.1") return 1;
            return 0;
        });
    
        res.json(availableSessions);
    });

    // Add players
    app.post("/fortnite/api/matchmaking/session/:sessionId/players", verifyToken, verifyDedicated, async (req, res) => {
        const session = await getSession(req.params.sessionId);
        if (!session) return res.status(404).end();

        const { publicPlayers = [], privatePlayers = [] } = req.body || {};
        
        if (publicPlayers) session.publicPlayers = [...new Set([...session.publicPlayers, ...publicPlayers])];
        if (privatePlayers) session.privatePlayers = [...new Set([...session.privatePlayers, ...privatePlayers])];

        await session.save();

        res.json({
            maxPublicPlayers: session.maxPublicPlayers,
            openPublicPlayers: session.openPublicPlayers,
            maxPrivatePlayers: session.maxPrivatePlayers,
            openPrivatePlayers: session.openPrivatePlayers,
            publicPlayers: session.publicPlayers,                 
            privatePlayers: session.privatePlayers
        });
    });
    
    // Delete players
    app.delete("/fortnite/api/matchmaking/session/:sessionId/players", verifyToken, verifyDedicated, async (req, res) => {
        const session = await getSession(req.params.sessionId);
        if (!session) return res.status(404).end();

        const players = req.body || [];
        if (!Array.isArray(players)) return res.status(400).end();
        
        if (players) {
            session.publicPlayers = session.publicPlayers.filter((player) => !players.includes(player));
            session.privatePlayers = session.privatePlayers.filter((player) => !players.includes(player));
        }
    
        await session.save();
    
        res.json({
            maxPublicPlayers: session.maxPublicPlayers,
            openPublicPlayers: session.openPublicPlayers,
            maxPrivatePlayers: session.maxPrivatePlayers,
            openPrivatePlayers: session.openPrivatePlayers,
            publicPlayers: session.publicPlayers,                 
            privatePlayers: session.privatePlayers
        });
    });

    // not doing much here
    app.get("/fortnite/api/matchmaking/session/:sessionId", verifyToken, async (req, res) => {
        const session = await getSession(req.params.sessionId);
        if (!session) return res.status(404).end();

        res.status(204).end();
    });


    
    app.get('/fortnite/api/matchmaking/session/findPlayer/:accountId', verifyToken, async (ctx) => {
        const accountId = ctx.params.accountId;
        if (!accountId) return ctx.status(400).end();

        const sessions = await findPlayer(accountId);
        if (!sessions) return ctx.status(404).end();

        ctx.body = sessions;
    });
}

async function getSession(id) {
    return await SessionModel.findOne({ id });
}

async function findPlayer(accountId) {
    if (typeof accountId !== "string") return [];
    return await SessionModel.find({ $or: [{ "publicPlayers.accountId": accountId }, { "privatePlayers.accountId": accountId }] }).lean();
}

const queryIgnore = ["MAXDIFFICULTY_i", "MINDIFFICULTY_i", "NEEDSSORT_i"];
async function matchMakingRequest(criteria) {
    if (criteria.criteria.some((criterion) => criterion.key === "GAMEMODE_s" && criterion.value === "FORTATHENA")) return [];

    const maxSessionResults = criteria.maxResults ? Math.max(criteria.maxResults, 30) : 30;

    const query = {};

    // Add criteria for open players if necessary
    if (criteria.openPlayersRequired) {
        query.openPublicPlayers = { $gt: 0 };
    }

    // Build the rest of the criteria query
    // NEEDSSORT_i, DISTANCE are unimplemented
    criteria.criteria.forEach((criterion) => {
        if (queryIgnore.includes(criterion.key)) return;

        switch (criterion.type) {
            case "EQUAL":
                query[`attributes.${criterion.key}`] = criterion.value;
                break;
            case "IN":
                query[`attributes.${criterion.key}`] = { $in: criterion.value };
                break;
            case "GREATER_THAN_OR_EQUAL":
                query[`attributes.${criterion.key}`] = { $gte: criterion.value };
                break;
            case "LESS_THAN_OR_EQUAL":
                query[`attributes.${criterion.key}`] = { $lte: criterion.value };
                break;
            default:
                // console.log("Unknown criterion type", criterion.type);
                break;
        }
    });

    const sessions = await SessionModel.find(query).limit(maxSessionResults).lean();

    return sessions;
}