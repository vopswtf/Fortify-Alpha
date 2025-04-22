module.exports = {
    name: "SetModeLoadout",
    handle: async (req, res, profile) => {
        const { heroId, heroModeLoadout, modeLoadout } = req.body;
        
        if (!profile.stats.attributes.mode_loadouts) profile.stats.attributes.mode_loadouts = [];
        const existingLoadout = profile.stats.attributes.mode_loadouts.find((loadout) => loadout.loadoutName === modeLoadout.loadoutName);

        if (existingLoadout) {
            existingLoadout.selectedGadgets = modeLoadout.selectedGadgets;
        } else {
            profile.stats.attributes.mode_loadouts.push(modeLoadout);
        }

        req.mcp.profileChanges.push({
            changeType: "statModified",
            name: "mode_loadouts",
            value: profile.stats.attributes.mode_loadouts,
        });

        await profile.save();
    }
};