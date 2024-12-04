const fs = require('fs');
const path = require('path');
const { verifyToken } = require('../util/middleware');

module.exports = (app) => {
    app.get('/fortnite/api/game/v2/outpost/:accountId', verifyToken, async (req, res) => {
        const theaterSlot = req.query.theaterSlot || 0;
        res.json({})
    });

    app.get('/fortnite/api/world/worlds/:somethingId-:accountId-outpost', verifyToken, async (req, res) => {
        res.json({})
    });

    app.post('/fortnite/api/world/worlds/:somethingId-:accountId-outpost/lock', verifyToken, async (req, res) => {
        console.log(req.body);
        res.json({})
    });

    app.post('/fortnite/api/matchmaking/session/matchMakingRequest', verifyToken, async (req, res) => {
        console.log(req.body);
        res.json([])
    });
}