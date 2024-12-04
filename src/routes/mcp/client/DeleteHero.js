const { getItem, generateAttributes } = require("../../../util/gameData");
const ProfileWrapper = require("../../../util/ProfileWrapper");

module.exports = {
    name: "DeleteHero",
    handle: async (req, res, profile) => {
        const { heroId } = req.body;
        if (!heroId) return res.status(400).json({ error: "missing_hero_id" });

        const profileWrapper = new ProfileWrapper(profile);
        profileWrapper.deleteItem(heroId, req.mcp.profileChanges);

        await profile.save();
    }
};