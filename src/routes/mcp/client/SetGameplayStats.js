const ProfileWrapper = require("../../../util/ProfileWrapper");

module.exports = {
    name: "SetGameplayStats",
    handle: async (req, res, profile) => {
        const profileWrapper = new ProfileWrapper(profile);
        const { gameplayStats } = req.body;
        if (!gameplayStats) return res.status(400).json({ error: "missing_gameplay_stats" });

        profileWrapper.updateStat("gameplayStats", gameplayStats, req.mcp.profileChanges);

        await profile.save();
    }
};