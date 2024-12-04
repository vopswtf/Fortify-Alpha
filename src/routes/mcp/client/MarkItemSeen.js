const ProfileWrapper = require("../../../util/ProfileWrapper");

module.exports = {
    name: "MarkItemSeen",
    handle: async (req, res, profile) => {
        const profileWrapper = new ProfileWrapper(profile);
        let changed = false;

        const itemIds = req.body.itemIds;
        if (!itemIds) return res.status(400).json({ error: "missing_item_ids" });

        for (const itemId of itemIds) {
            profileWrapper.updateAttribute(itemId, "item_seen", true, req.mcp.profileChanges);
            profileWrapper.updateAttribute(itemId, "bItemSeen", 1, req.mcp.profileChanges);
            changed = true;
        }

        if (changed) await profile.save();
    }
};