const { getItem, generateAttributes, getItemsStartingWith } = require("../../../util/gameData");
const ProfileWrapper = require("../../../util/ProfileWrapper");

module.exports = {
    name: "CreateBuilding",
    handle: async (req, res, profile) => {
        const { templateId } = req.body;
        
        if (!templateId) return res.status(400).json({ error: "missing_parameters" });
        if (!templateId.startsWith("MyFortBuilding.")) return res.status(400).json({ error: "invalid_building_template_id" });
        const item = getItem(templateId);
        if (!item) return res.status(400).json({ error: "invalid_building_template_id" });

        const profileWrapper = new ProfileWrapper(profile);
        const buildingItem = profileWrapper.findTemplateId(templateId);
        if (!buildingItem) return res.status(400).json({ error: "building_not_found" });

        if (buildingItem.value.attributes.buildingState !== "CanBuild") return res.status(400).json({ error: "building_cannot_build" });

        // TODO implement taking their resources away

        profileWrapper.updateAttribute(buildingItem.key, "level", 1, req.mcp.profileChanges);
        profileWrapper.updateAttribute(buildingItem.key, "buildingState", "CanUpgrade", req.mcp.profileChanges);

        profileWrapper.updateAttribute(buildingItem.key, "item_seen", true, req.mcp.profileChanges);
        profileWrapper.updateAttribute(buildingItem.key, "bItemSeen", 1, req.mcp.profileChanges);

        await profile.save();
    }
};