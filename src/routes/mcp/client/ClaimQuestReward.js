const { getItem, generateAttributes } = require("../../../util/gameData");
const ProfileWrapper = require("../../../util/ProfileWrapper");
const { addQuest } = require("../../../util/quests");

module.exports = {
    name: "ClaimQuestReward",
    handle: async (req, res, profile) => {
        const profileWrapper = new ProfileWrapper(profile);
        let changed = false;

        const questId = req.body.questId;
        if (!questId) return res.status(400).json({ error: "missing_quest_id" });
        
        const quest = profile.items[questId];
        if (!quest) return res.status(400).json({ error: "invalid_quest_id" });

        if (quest.attributes.quest_state !== "Completed") return res.status(400).json({ error: "quest_not_completed" });

        const questData = getItem(quest.templateId);
        if (!questData) return res.status(400).json({ error: "invalid_quest_template" });

        profileWrapper.updateAttribute(questId, "quest_state", "Claimed", req.mcp.profileChanges);
        profileWrapper.updateAttribute(questId, "state", "Claimed", req.mcp.profileChanges);
        
        profile.markModified(`items.${questId}.attributes`);

        // TODO: move this to OT notifications
        const notification = {
            type: "questClaim",
            primary: true,
            questId: questId,
            loot: {
                items: []
            }
        }

        console.log(`Claiming quest reward for ${quest.templateId}`);

        for (const reward of questData.Properties.Rewards) {
            const { ItemDefinition, Quantity } = reward;
            const item = getItem(ItemDefinition.split(".")[1]);
            console.log(`Adding reward ${item.templateId} x${Quantity}`);
            if (!item) return res.status(400).json({ error: "invalid_reward_item" });

            if (item.prefix === "Quest") {
                addQuest(profile, item.templateId, req.mcp.profileChanges);
            } else {
                const attributes = generateAttributes(item.templateId);
                profileWrapper.addQuantity(item.templateId, Quantity, req.mcp.profileChanges, attributes);

                notification.loot.items.push({
                    item: item,
                    templateId: item.templateId,
                    quantity: Quantity,
                    attributes: attributes
                });
            }

            changed = true;
        }

        req.mcp.notifications = [notification];

        if (changed) await profile.save();
    }
};