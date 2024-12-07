const { getAllItems, generateAttributes } = require("../../../util/gameData");
const ProfileWrapper = require("../../../util/ProfileWrapper");

const schematics = getAllItems("Schematic")//.filter(schematic => schematic.Name.endsWith("T01"));

// credit to mercury for notification object
module.exports = {
    name: "OpenCardPack",
    handle: async (req, res, profile) => {
        const { cardPackItemId, selectionIdx } = req.body;
        if (!cardPackItemId) return req.mcpError("Card pack item not found");

        const cardPackItem = profile.items[cardPackItemId];
        if (!cardPackItem) return req.mcpError("Card pack item not found");

        console.log(`Opening card pack ${cardPackItem.templateId}`);
        
        const profileWrapper = new ProfileWrapper(profile);
        profileWrapper.removeItemQuantity(cardPackItemId, 1, req.mcp.profileChanges);
        
        const notification = {
            client_request_id: "",
            displayLevel: 0,
            lootGranted: {
              persistentItems: [],
              worldItems: [],
              tierGroupName: cardPackItem.templateId.split(".")[1],
            },
            overrideTier: 0,
            primary: true,
            tier: 0,
            tierGroupName: cardPackItem.templateId.split(".")[1],
            type: "cardPackResult"
        };

        // no actual loot system yet just 6 random schems
        // TODO: custom loot per cardpack type
        for (let i = 0; i < 6; i++) {
            const schematic = schematics[Math.floor(Math.random() * schematics.length)];

            const guid = profileWrapper.addItem({
                templateId: schematic.templateId,
                attributes: generateAttributes(schematic.templateId),
                quantity: 1
            }, req.mcp.profileChanges);
            
            notification.lootGranted.persistentItems.push({
                itemGuid: guid,
                itemType: schematic.templateId,
                quantity: 1,
                attributes: profile.items[guid].attributes
            });
        }
        
        req.mcp.notifications = [notification];
        await profile.save();
    }
};