const ProfileWrapper = require("../../../util/ProfileWrapper");

/*
    {
    heroId: '4417a190-fd48-451e-96b7-1d733a4e3572',
    primaryTraitAbilities: 5,
    secondaryTraitAbilities_Alpha: 0,
    secondaryTraitAbilities_Beta: 0,
    secondaryTraitAbilities_Gamma: 0,
    secondaryTraitAbilities_Delta: 0
    }
*/

module.exports = {
    name: "SetHeroAbilities",
    handle: async (req, res, profile) => {
        const profileWrapper = new ProfileWrapper(profile);
        const { 
            heroId, 
            primaryTraitAbilities, 
            secondaryTraitAbilities_Alpha, 
            secondaryTraitAbilities_Beta, 
            secondaryTraitAbilities_Gamma, 
            secondaryTraitAbilities_Delta 
        } = req.body;

        const hero = profile.items[heroId];
        if (!hero) return res.status(400).json({ error: "invalid_hero_id" });

        profileWrapper.updateAttribute(heroId, "Primary_Trait_Abilities", primaryTraitAbilities, req.mcp.profileChanges);
        profileWrapper.updateAttribute(heroId, "Secondary_Trait_Alpha_Abilities", secondaryTraitAbilities_Alpha, req.mcp.profileChanges);
        profileWrapper.updateAttribute(heroId, "Secondary_Trait_Beta_Abilities", secondaryTraitAbilities_Beta, req.mcp.profileChanges);
        profileWrapper.updateAttribute(heroId, "Secondary_Trait_Gamma_Abilities", secondaryTraitAbilities_Gamma, req.mcp.profileChanges);
        profileWrapper.updateAttribute(heroId, "Secondary_Trait_Delta_Abilities", secondaryTraitAbilities_Delta, req.mcp.profileChanges);

        await profile.save();
    }
};