const UserModel = require('../model/user');
const { verifyToken } = require('../util/middleware');

module.exports = (app) => {
    app.get('/account/api/accounts/:accountId/metadata', (req, res) => {
        res.json({ authorizedClientIDs:"34a02cf8f4414e29b15921876da36f9a:daafbccc737745039dffe53d94fc76cf", FGOnboarded: true });
    });

    app.get('/account/api/accounts/:accountId/externalAuths', (req, res) => {
        res.json([]);
    });

    app.get("/account/api/public/account/:accountId", verifyToken, async (req, res) => {
        const user = await UserModel.findOne({ accountId: req.params.accountId }).lean();
        if (!user) return res.status(404).json({ error: "user not found" });

        res.json({
            id: user.accountId,
            displayName: user.username,
            name: user.username,
            email: `[hidden]@v0ps.cc`,
            failedLoginAttempts: 0,
            lastLogin: new Date().toISOString(),
            numberOfDisplayNameChanges: 0,
            ageGroup: "UNKNOWN",
            headless: false,
            country: "US",
            lastName: user.username,
            preferredLanguage: "en",
            canUpdateDisplayName: true,
            tfaEnabled: false,
            emailVerified: true,
            minorVerified: false,
            minorExpected: false,
            minorStatus: "NOT_MINOR",
            cabinedMode: false,
            hasHashedEmail: false
        });
    });
};