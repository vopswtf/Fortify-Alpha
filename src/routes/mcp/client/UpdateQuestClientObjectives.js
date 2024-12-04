const { advanceObjectives } = require("../../../util/quests");

module.exports = {
    name: "UpdateQuestClientObjectives",
    handle: async (req, res, profile) => {
        let changed = req.body.advance && advanceObjectives(profile, req.body.advance, true, req.mcp.profileChanges);
        if (changed) await profile.save();
    }
};