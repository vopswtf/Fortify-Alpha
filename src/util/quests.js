const { getItem, getTable, generateAttributes, getAllItems } = require("./gameData");
const ProfileWrapper = require("../util/ProfileWrapper");
const crypto = require("crypto");
const ProfileModel = require("../model/profile");
const { profile } = require("console");

const addQuest = (profile, questId, ApplyProfileChanges = []) => {
    const profileWrapper = new ProfileWrapper(profile);
    const quest = getItem(questId);
    if (!quest) {
        console.error(`Quest data ${questId} not found`);
        return;
    }

    const questTemplateId = quest.templateId;
    if (profileWrapper.findTemplateId(questTemplateId) !== null) return; // no dupe quests

    const questItem = {
        templateId: questTemplateId,
        attributes: generateAttributes(questTemplateId),
        quantity: 1
    }

    return profileWrapper.addItem(questItem, ApplyProfileChanges);
}

const completeQuest = (profile, questId, ApplyProfileChanges = []) => {
    const profileWrapper = new ProfileWrapper(profile);
    const quest = getItem(questId);
    if (!quest) {
        console.error(`Quest data ${questId} not found`);
        return;
    }

    if (quest.templateId === "Quest.homebaseonboarding") {
        completeQuest(profile, "Quest.outpostquest_t1_l1", ApplyProfileChanges);
    }

    const profileQuest = profileWrapper.findTemplateId(quest.templateId);
    if (!profileQuest) return; // quest not found

    const questItem = profileQuest.value;

    if (quest.Properties.Objectives) {
        for (const objective of quest.Properties.Objectives) {
            let backendName = objective.ObjectiveStatHandle.RowName.toLowerCase();
            if (questItem.attributes[`completion_${backendName}`] === objective.Count) continue;
            questItem.attributes[`completion_${backendName}`] = objective.Count;

            ApplyProfileChanges.push({
                "changeType": "itemAttrChanged",
                "itemId": profileQuest.key,
                "attributeName": `completion_${backendName}`,
                "attributeValue": 1
            })
        };
    }

    profileWrapper.updateAttribute(profileQuest.key, "state", quest.Properties.Rewards ? "Completed" : "Claimed", ApplyProfileChanges);
    profileWrapper.updateAttribute(profileQuest.key, "quest_state", quest.Properties.Rewards ? "Completed" : "Claimed", ApplyProfileChanges);
    profileWrapper.updateAttribute(profileQuest.key, "last_state_change_time", new Date().toISOString(), ApplyProfileChanges);
    profileWrapper.updateAttribute(profileQuest.key, "bAllObjectivesComplete", true, ApplyProfileChanges);
    
    profile.markModified(`items.${profileQuest.key}.attributes`);

    if (quest.Properties.Rewards) {
        for (const reward of quest.Properties.Rewards) {
            const { ItemDefinition, Quantity } = reward;
            const rewardDef = getItem(ItemDefinition.split(".")[1]);
            if (!rewardDef) {
                console.error(`Reward data ${ItemDefinition} not found`);
                continue;
            }

            const rewardTemplateId = rewardDef.templateId;

            if (rewardDef.prefix === "Quest") {
                addQuest(profile, rewardDef.Name, ApplyProfileChanges);
            } else {
                profileWrapper.addQuantity(rewardTemplateId, Quantity, ApplyProfileChanges);
            }
        }
    }

}

const advanceObjectives = (profile, advance, isClient, ApplyProfileChanges = []) => {
    if (!advance || !(advance instanceof Array)) return;
    let changed = false;

    for (const i in advance) {
        const objective = advance[i];
        if (!objective.statName || !objective.count) continue;

        const QuestsToUpdate = [];

        for (const guid in profile.items) {
            const item = profile.items[guid];
            if (!item.templateId.startsWith("Quest.")) continue;

            for (const attribute in item.attributes) {
                if (attribute.toLowerCase() !== `completion_${objective.statName}`) continue;
                QuestsToUpdate.push(guid);
            }
        }

        for (const questId of QuestsToUpdate) {
            profile.items[questId].attributes[`completion_${objective.statName}`] += objective.count;
            profile.markModified(`items.${questId}.attributes.completion_${objective.statName}`);

            ApplyProfileChanges.push({
                "changeType": "itemAttrChanged",
                "itemId": questId,
                "attributeName": `completion_${objective.statName}`,
                "attributeValue": objective.count
            })

            changed = true;
        }
    }

    if (changed) checkForCompleteQuests(profile, ApplyProfileChanges);

    return changed;
}

function checkForCompleteQuests(questProfile, ApplyProfileChanges = []) {
    for (const key of Object.keys(questProfile.items)) {
        if (!questProfile.items[key].templateId.startsWith("Quest.")) continue;

        const quest = questProfile.items[key];

        if (quest.attributes.quest_state !== "Active") continue;

        // if all completion stats are equal to the objective count, complete the quest
        const questData = getItem(quest.templateId);
        if (!questData) continue;

        let bIncomplete = false;
        for (const objective of questData.Properties.Objectives) {
            let backendName = objective.ObjectiveStatHandle.RowName.toLowerCase();

            if (quest.attributes[`completion_${backendName}`] !== objective.Count) {
                bIncomplete = true;
            }
        }

        if (bIncomplete) continue;
        completeQuest(questProfile, quest.templateId, ApplyProfileChanges);
    }
}

module.exports = { 
    addQuest, 
    completeQuest,
    advanceObjectives,
    checkForCompleteQuests
};