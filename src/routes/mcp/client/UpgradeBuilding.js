const { getItem, generateAttributes } = require("../../../util/gameData");
const ProfileWrapper = require("../../../util/ProfileWrapper");

module.exports = {
    name: "UpgradeBuilding",
    handle: async (req, res, profile) => {
        const { buildingId } = req.body;
        if (!buildingId) return res.status(400).json({ error: "missing_target_item_id" });

        const profileWrapper = new ProfileWrapper(profile);
        const targetItem = profile.items[buildingId];
        if (!targetItem) return res.status(400).json({ error: "invalid_target_item" });
        if (targetItem.attributes.level === 5) return res.status(400).json({ error: "max_level" }); // probably

        // TODO: validate if the item can be upgraded, take resources

        profileWrapper.updateAttribute(buildingId, "level", targetItem.attributes.level + 1, req.mcp.profileChanges);
        
        if (targetItem.attributes.level === 5) {
            profileWrapper.updateAttribute(buildingId, "buildingState", "Idle", req.mcp.profileChanges);
        }

        await profile.save();
    }
};