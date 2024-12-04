const ProfileWrapper = require("../../../util/ProfileWrapper");

module.exports = {
    name: "SetDefaultHero",
    handle: async (req, res, profile) => {
        const profileWrapper = new ProfileWrapper(profile);
        const defaultHeroId = req.body.defaultHeroId;
        if (!defaultHeroId) return res.status(400).json({ error: "missing_default_hero_id" });
        
        profileWrapper.updateStat("defaultHeroId", defaultHeroId, req.mcp.profileChanges);

        await profile.save();
    }
};