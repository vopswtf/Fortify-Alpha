const fs = require('fs');
const { type } = require('os');
const path = require('path');
const walk = require('walkdir');

// this runs before the server starts
const GAME_DATA_FOLDER = path.join(__dirname, '../../common/game_data');
const gameData = {};
const tables = {};

walk.sync(GAME_DATA_FOLDER, (path, stat) => {
    if (!stat.isFile()) return;

    const file = fs.readFileSync(path);
    let json;

    try {
        json = JSON.parse(file);
    } catch (e) {
        console.error(`Failed to parse ${path}`);
        return;
    }

    for (element in json) {
        const data = json[element];
        if (!data.Type) return;

        if (data.Type.endsWith("Table")) {
            tables[data.Name] = data;
            return
        }

        const templateId = generateTemplateId(data);
        if (!templateId) {
            // console.error(`Failed to generate templateId for ${data.Type} ${data.Name}`);
            return;
        }

        data.templateId = templateId;
        data.prefix = templateId.split(".")[0];
        gameData[templateId] = data;
    }
});

function generateTemplateId(data) {
    const name = data.Name.toLowerCase();

    switch (data.Type) {
        case "FortQuestItemDefinition": return `Quest.${name}`;
        case "FortWeaponMeleeItemDefinition": return `Weapon.${name}`;
        case "FortWeaponRangedItemDefinition": return `Weapon.${name}`;
        case "FortEditToolItemDefinition": return `Weapon.${name}`;
        case "FortBuildingItemDefinition": return `Weapon.${name}`;
        case "FortPersistentResourceItemDefinition": return `AccountResource.${name}`;
        case "MyTownBuildingDefinitionData": return `MyFortBuilding.${data.Name}`;
        case "FortSchematicItemDefinition": return `Schematic.${name}`;
        case "FortTokenType": return `Token.${name}`;
        case "FortIngredientItemDefinition": return `Ingredient.${name}`;
        case "FortConsumableItemDefinition": return `Food.${name}`;
        case "FortHeroType": return `Hero.${name}`;
        case "FortCardPackItemDefinition": return `CardPack.${name}`;
        case "FortBadgeItemDefinition": return `Badge.${name}`;
        case "FortAlterationItemDefinition": return `Alteration.${name}`;
        case "FortWorkerType": return `Worker.${name}`;
        case "FortResourceItemDefinition": return `Resource.${name}`;
        case "FortCurrencyItemDefinition": return `Currency.${name}`;
        case "FortGadgetItemDefinition": return `Gadget.${name}`;
        case "FortTrapItemDefinition": return `Trap.${name}`;
        default: return null;
    }
}

// public stuff
const getItem = (name) => {
    if (!name) return null;
    if (gameData[name]) return gameData[name];

    for (const key in gameData) {
        if (gameData[key].Name.toLowerCase() === name.toLowerCase()) return gameData[key];
        if (gameData[key].templateId.toLowerCase() === name.toLowerCase()) return gameData[key];
    }

    return null;
}

const getItemsStartingWith = (prefix) => {
    const items = [];

    for (const key in gameData) {
        if (gameData[key].templateId.toLowerCase().startsWith(prefix.toLowerCase())) items.push(gameData[key]);
    }

    return items;
}

const getAllItems = (type) => {
    const items = [];

    for (const key in gameData) {
        if (gameData[key].Type === type || gameData[key].prefix === type) items.push(gameData[key]);
    }

    return items;
}

const getTable = (name) => {
    return tables[name];
}

const generateAttributes = (templateId) => {
    let attributes = {
        max_level_bonus: 0,
        level: 1,
        item_seen: false,
        bItemSeen: 0,
        xp: 0,
        variants: [],
        favorite: false
    }

    const prefix = templateId.split(".")[0];

    switch (prefix) {
        case "Quest":
            attributes.bSentNewNotification = false;
            attributes.bAllObjectivesComplete = false;
            attributes.quest_pool = "";
            attributes.quest_state = "Active";
            attributes.state = "Active";
            attributes.last_state_change_time = new Date().toISOString();
            attributes.quest_rarity = "uncommon";
            attributes.level = -1;

            const questData = getItem(templateId);
            if (!questData) break;
            if (!questData.Properties || !questData.Properties.Objectives) break;

            questData.Properties.Objectives.forEach(objective => {
                attributes[`completion_${objective.ObjectiveStatHandle.RowName}`] = 0;
            });
            break;
        case "MyFortBuilding":
            // Locked, CanBuild. CanUpdate, Idle
            attributes.level = 0;
            attributes.buildingState = "Locked";
            attributes.managerInstanceId = ""
            attributes.workerInstanceIds = ["", "", "", "", "", ""]
            attributes.parentBuildingId = ""
            break;
        case "Trap":
        case "Weapon":
        case "Food":
            attributes.alterationDefinitions = [];
            attributes.durability = 375; // ill just put this here for now
            attributes.inventory_overflow_date = false;
            attributes.itemSource = null;
            attributes.level = 1;
            attributes.loadedAmmo = 0;
            break;
        case "Hero":
            attributes.hero_name = "Default Hero Name";
            attributes.gender = 1;
            attributes.mode_loadouts = [];
            break;
        case "Worker":
            attributes.personality = "Default"; // TODO call up prokat ion wanna make this
            break;
        default:
            break;
    }

    return attributes;
};

module.exports = {
    getItem,
    getTable,
    generateAttributes,
    getAllItems,
    getItemsStartingWith
};