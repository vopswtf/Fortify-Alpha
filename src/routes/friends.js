const { verifyToken } = require("../util/middleware");

module.exports = (app) => {
    app.get("/friends/api/public/friends/:accountId", verifyToken, async (req, res) => {
        if (req.params.accountId !== req.user.accountId) return res.status(403).json({ error: "forbidden" });
        res.json([]);
    });

    app.get("/friends/api/public/blocklist/:accountId", (req, res) => {
        res.json({ blockedUsers: [] });
    });
};