const ProfileWrapper = require("../../../util/ProfileWrapper");

module.exports = {
    name: "SetHomebaseMeta",
    handle: async (req, res, profile) => {
        const profileWrapper = new ProfileWrapper(profile);

        profileWrapper.updateStat("homebase", {
            townName: req.body.townName || "Homebase",
            flagPattern: req.body.flagPattern || 0,
            flagColor: req.body.flagColor || 0.5
        }, req.mcp.profileChanges);

        await profile.save();
    }
};