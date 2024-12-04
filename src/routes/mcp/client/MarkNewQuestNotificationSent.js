const ProfileWrapper = require("../../../util/ProfileWrapper");

module.exports = {
    name: "MarkNewQuestNotificationSent",
    handle: async (req, res, profile) => {
        const profileWrapper = new ProfileWrapper(profile);
        let changed = false;

        const itemIds = req.body.itemIds;
        if (!itemIds) return res.status(400).json({ error: "missing_item_ids" });

        for (const itemId of itemIds) {
            const item = profile.items[itemId];
            if (!item || !item.templateId.startsWith("Quest.")) continue;

            profileWrapper.updateAttribute(itemId, "bSentNewNotification", true, req.mcp.profileChanges);
            changed = true;
        }

        if (changed) await profile.save();
    }
};