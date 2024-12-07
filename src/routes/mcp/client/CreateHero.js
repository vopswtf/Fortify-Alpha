const { getItem, generateAttributes } = require("../../../util/gameData");
const ProfileWrapper = require("../../../util/ProfileWrapper");
const { completeQuest } = require("../../../util/quests");

module.exports = {
    name: "CreateHero",
    handle: async (req, res, profile) => {
        const { heroName, gender, heroTemplateId } = req.body;
        
        if (!heroName || !gender || !heroTemplateId) return res.status(400).json({ error: "missing_parameters" });
        if (!heroTemplateId.startsWith("Hero.")) return res.status(400).json({ error: "invalid_hero_template_id" });
        const item = getItem(heroTemplateId);
        if (!item) return res.status(400).json({ error: "invalid_hero_template_id" });

        if (heroName.toLowerCase() === "forcequest") {
            for (const key of Object.keys(profile.items)) {
                if (!profile.items[key].templateId.startsWith("Quest.")) continue;
                const quest = profile.items[key];
                if (quest.attributes.quest_state !== "Active") continue;
                completeQuest(profile, quest.templateId,  req.mcp.profileChanges);
            }

            await profile.save();
            return;
        }

        const profileWrapper = new ProfileWrapper(profile);

        const attributes = generateAttributes(heroTemplateId);
        attributes.hero_name = heroName;
        attributes.gender = gender;
        attributes.level = 20;

        profileWrapper.addItem({
            templateId: item.templateId,
            attributes: attributes,
            quantity: 1
        }, req.mcp.profileChanges);

        await profile.save();
    }
};