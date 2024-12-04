const { getItem, generateAttributes, getTable } = require("../../../util/gameData");
const ProfileWrapper = require("../../../util/ProfileWrapper");
const XPAccountItemLevels = getTable("XPAccountItemLevels");

module.exports = {
    name: "UpgradeItem",
    handle: async (req, res, profile) => {
        const { targetItemId } = req.body;
        if (!targetItemId) return res.status(400).json({ error: "missing_target_item_id" });

        const profileWrapper = new ProfileWrapper(profile);
        const targetItem = profile.items[targetItemId];
        if (!targetItem) return res.status(400).json({ error: "invalid_target_item" });

        const itemInfo = getItem(targetItem.templateId);
        if (!itemInfo) return res.status(400).json({ error: "missing_item_info" });

        const RowName = itemInfo.Properties?.LevelToXpHandle?.RowName;
        if (!RowName) return res.status(400).json({ error: "invalid_row_name" });

        const Row = XPAccountItemLevels.Rows[RowName];
        if (!Row) return res.status(400).json({ error: "invalid_row" });

        const requiredSchematicXP = Row.Keys[targetItem.attributes.level - 1];
        if (!requiredSchematicXP) return res.status(400).json({ error: "invalid_required_xp" });

        console.log(requiredSchematicXP);
        
        const schematicXp = profileWrapper.getQuantity("AccountResource.schematicxp");
        if (schematicXp < requiredSchematicXP.Value) return res.status(400).json({ error: "insufficient_schematic_xp" });

        profileWrapper.removeQuantity("AccountResource.schematicxp", requiredSchematicXP.Value, req.mcp.profileChanges);
        profileWrapper.updateAttribute(targetItemId, "level", targetItem.attributes.level + 1, req.mcp.profileChanges);

        await profile.save();
    }
};