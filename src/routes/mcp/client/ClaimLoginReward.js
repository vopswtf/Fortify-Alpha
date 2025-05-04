const { getItem, getTable, generateAttributes } = require("../../../util/gameData");
const ProfileWrapper = require("../../../util/ProfileWrapper");
const { addQuest } = require("../../../util/quests");

module.exports = {
    name: "ClaimLoginReward",
    handle: async (req, res, profile) => {
        const profileWrapper = new ProfileWrapper(profile);
        
        const login_reward = profile.stats.attributes.login_reward;
        if (!login_reward) return res.status(400).json({ error: "missing_login_reward" });

        if (!login_reward.next_level || login_reward.next_level >= 335) {
            login_reward.next_level = 0;
        }

        login_reward.next_level += 1;

        const table = getTable("DailyRewards");
        if (!table) return res.status(400).json({ error: "missing_daily_rewards_table" });

        const reward = table.Rows[login_reward.next_level];
        if (!reward) return res.status(400).json({ error: "missing_daily_reward" });
    
        const { ItemDefinition, ItemCount } = reward;
        if (!ItemDefinition || !ItemCount) return res.status(400).json({ error: "missing_daily_reward_item" });
        
        const item = getItem(ItemDefinition);
        if (!item) return res.status(400).json({ error: "missing_daily_reward_item" });

        login_reward.last_claim_time = new Date().toISOString();

        profileWrapper.addQuantity(item.templateId, ItemCount, req.mcp.profileChanges);
        profileWrapper.updateStat("login_reward", login_reward, req.mcp.profileChanges);

        await profile.save();
    }
}