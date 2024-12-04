const { getItem, generateAttributes } = require("../../../util/gameData");
const ProfileWrapper = require("../../../util/ProfileWrapper");

module.exports = {
    name: "CreateHero",
    handle: async (req, res, profile) => {
        const { heroName, gender, heroTemplateId } = req.body;
        
        if (!heroName || !gender || !heroTemplateId) return res.status(400).json({ error: "missing_parameters" });
        if (!heroTemplateId.startsWith("Hero.")) return res.status(400).json({ error: "invalid_hero_template_id" });
        const item = getItem(heroTemplateId);
        if (!item) return res.status(400).json({ error: "invalid_hero_template_id" });

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