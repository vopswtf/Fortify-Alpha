const { getItem, generateAttributes } = require("../../../util/gameData");
const ProfileWrapper = require("../../../util/ProfileWrapper");

module.exports = {
    name: "UpgradeWorker",
    handle: async (req, res, profile) => {
        const { targetWorkerId } = req.body;
        if (!targetWorkerId) return res.status(400).json({ error: "missing_target_item_id" });

        const profileWrapper = new ProfileWrapper(profile);
        const targetItem = profile.items[targetWorkerId];
        if (!targetItem || !targetItem.templateId.startsWith("Worker.")) return res.status(400).json({ error: "invalid_target_item" });

        profileWrapper.updateAttribute(targetWorkerId, "level", targetItem.attributes.level + 1, req.mcp.profileChanges);
        await profile.save();

        // TODO: validate if the item can be upgraded, take resources
    }
};