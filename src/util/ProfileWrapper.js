const crypto = require('crypto');
const { generateAttributes } = require('./gameData');
const ProfileModel = require('../model/profile');

const infiniteSize = [
    "AccountResource",
    "Token",
    "Resource",
    "Currency"
]

// this is also the remove priority
const MtxCurrency = [
    "currency.mtxcomplimentary",
    "currency.mtxpurchasebonus",
    "currency.mtxpurchased",
    "currency.mtxgiveaway",
];

module.exports = class ProfileWrapper {
    constructor(profile) {
        this.profile = profile;
    }

    findTemplateId(templateId) {
        const entry = Object.entries(this.profile.items)
            .reverse() // Reverse the entries to prioritize the newest ones, this helps with crafting etc
            .find(([key, item]) =>
                item.templateId.toLowerCase() === templateId.toLowerCase()
            );
    
        return entry ? { key: entry[0], value: entry[1] } : null;
    }

    findTemplateIds(templateId, sameAttributes = {}) {
        const entries = Object.entries(this.profile.items).filter(([key, item]) =>
            item.templateId.toLowerCase() === templateId.toLowerCase()
        );

        if (Object.keys(sameAttributes).length > 0) {
            return entries.filter(([key, item]) => {
                for (const [key, value] of Object.entries(sameAttributes)) {
                    if (item.attributes[key] !== value) return false;
                }

                return true;
            });
        }

        return entries.length > 0 ? entries : null;
    }

    getQuantity(templateId) {
        const entries = Object.entries(this.profile.items).filter(([key, item]) =>
            item.templateId.toLowerCase() === templateId.toLowerCase() || key === templateId
        );

        if (entries.length === 0) return 0;

        return entries.reduce((acc, [key, item]) => acc + (item.quantity || 0), 0);
    }

    addItem(item, ApplyProfileChanges = []) {
        const id = crypto.randomUUID();
        this.profile.items[id] = item;
        this.profile.markModified(`items.${id}`)

        ApplyProfileChanges.push({
            "changeType": "itemAdded",
            "itemId": id,
            "item": item
        })

        return id;
    }

    deleteItem(itemGuid, ApplyProfileChanges) {
        delete this.profile.items[itemGuid];
        this.profile.markModified(`items`);

        ApplyProfileChanges.push({
            "changeType": "itemRemoved",
            "itemId": itemGuid
        })
    }

    updateAttribute(itemGuid, attribute, value, ApplyProfileChanges = []) {
        this.profile.items[itemGuid].attributes[attribute] = value;
        this.profile.markModified(`items.${itemGuid}.attributes.${attribute}`);

        ApplyProfileChanges.push({
            "changeType": "itemAttrChanged",
            "itemId": itemGuid,
            "attributeName": attribute,
            "attributeValue": value
        })
    }

    updateStat(key, value, ApplyProfileChanges = []) {
        this.profile.stats.attributes[key] = value;
        this.profile.markModified(`stats.attributes.${key}`);

        ApplyProfileChanges.push({
            "changeType": "statModified",
            "statName": key,
            "statValue": value
        })
    }

    addQuantity(templateId, quantity, ApplyProfileChanges = [], customAttributes = {}) {
        const debug = false;
        if (quantity <= 0) return;
        const prefix = templateId.split(".")[0];
        const item = require('./gameData').getItem(templateId);
        let maxStackSize = item?.MaxStackSize;

        if (!maxStackSize || maxStackSize === -1) {
            if (maxStackSize === -1 || infiniteSize.includes(prefix)) {
                maxStackSize = Number.MAX_SAFE_INTEGER
            } else {
                maxStackSize = 1;
            }
        };

        let attributes = generateAttributes(templateId)
        if (Object.keys(customAttributes).length > 0) {
            attributes = { ...attributes, ...customAttributes }
        };

        const level = {}
        if (attributes.level && attributes.level > 1) level.level = attributes.level;

        let remainingQuantity = quantity;

        this.profile.markModified(`items`);

        while (remainingQuantity > 0) {
            if (debug) console.log(`Remaining Quantity: ${remainingQuantity}`);
            // get existing items with the templateId
            const existingItems = this.findTemplateIds(templateId, level);

            // if there are no existing items, create a new one
            if (existingItems === null || existingItems.length === 0) {
                if (debug) console.log("No existing items found, creating a new one.");
                const newKey = crypto.randomUUID();

                this.profile.items[newKey] = {
                    templateId,
                    attributes: attributes,
                    quantity: Math.min(maxStackSize, remainingQuantity),
                };

                ApplyProfileChanges.push({
                    "changeType": "itemAdded",
                    "itemId": newKey,
                    "item": this.profile.items[newKey]
                })

                remainingQuantity -= maxStackSize;
                continue;
            }

            // loop through each existing item and add the quantity to it
            if (debug) console.log("Existing items found, adding quantity to them.");
            for (const [key, item] of existingItems) {
                let quantityToAdd = remainingQuantity;

                if (item.quantity + remainingQuantity > maxStackSize) {
                    quantityToAdd = maxStackSize - item.quantity;
                }

                item.quantity += quantityToAdd;
                remainingQuantity -= quantityToAdd;

                //if (debug) console.log(`Added ${quantityToAdd} to item ${key}, new quantity: ${item.quantity}`);

                ApplyProfileChanges.push({
                    "changeType": "itemQuantityChanged",
                    "itemId": key,
                    "quantity": item.quantity
                })

                if (remainingQuantity === 0) break;
            }

            // if there is still remainingQuantity, create a new item
            if (remainingQuantity > 0) {
                if (debug) console.log("Still remaining quantity, creating a new item.");
                const newKey = crypto.randomUUID();

                this.profile.items[newKey] = {
                    templateId,
                    attributes: attributes,
                    quantity: Math.min(maxStackSize, remainingQuantity),
                };

                ApplyProfileChanges.push({
                    "changeType": "itemAdded",
                    "itemId": newKey,
                    "item": this.profile.items[newKey]
                })

                remainingQuantity -= maxStackSize;
            }
        }
    }

    removeItemQuantity(itemKey, quantityToRemove, ApplyProfileChanges = []) {
        const item = this.profile.items[itemKey];
        if (!item) return;

        if (item.quantity <= quantityToRemove) {
            delete this.profile.items[itemKey];
            this.profile.markModified(`items.${itemKey}`);

            ApplyProfileChanges.push({
                "changeType": "itemRemoved",
                "itemId": itemKey
            })
        } else {
            item.quantity -= quantityToRemove;
            this.profile.markModified(`items.${itemKey}`);

            ApplyProfileChanges.push({
                "changeType": "itemQuantityChanged",
                "itemId": itemKey,
                "quantity": item.quantity
            })
        }
    }

    removeQuantity(templateId, quantityToRemove, ApplyProfileChanges = []) {
        const entries = Object.entries(this.profile.items).filter(([key, item]) =>
            item.templateId.toLowerCase() === templateId.toLowerCase() || key === templateId
        );

        if (entries.length === 0) return;

        let remainingQuantity = quantityToRemove;
        this.profile.markModified(`items`);

        for (const [key, item] of entries) {
            const quantityToRemoveFromItem = Math.min(item.quantity, remainingQuantity);

            item.quantity -= quantityToRemoveFromItem;
            remainingQuantity -= quantityToRemoveFromItem;

            if (item.quantity === 0) {
                delete this.profile.items[key];

                ApplyProfileChanges.push({
                    "changeType": "itemRemoved",
                    "itemId": key
                })
            } else {
                ApplyProfileChanges.push({
                    "changeType": "itemQuantityChanged",
                    "itemId": key,
                    "quantity": item.quantity
                })
            }

            if (remainingQuantity === 0) break;
        }
    }

    getMtx() {
        let mtx = 0;
        for (const item of Object.values(this.profile.items)) {
            if (MtxCurrency.includes(item.templateId.toLowerCase())) {
                mtx += item.quantity;
            }
        }

        return mtx;
    }

    removeMtx(amount, ApplyProfileChanges = []) {
        if (amount <= 0) return;
        this.profile.markModified(`items`);

        let remainingAmount = amount;
        for (const [key, item] of Object.entries(this.profile.items)) {
            if (MtxCurrency.includes(item.templateId.toLowerCase())) {
                const amountToRemove = Math.min(item.quantity, remainingAmount);

                item.quantity -= amountToRemove;
                remainingAmount -= amountToRemove;

                if (item.quantity === 0) {
                    delete this.profile.items[key];

                    ApplyProfileChanges.push({
                        "changeType": "itemRemoved",
                        "itemId": key
                    })
                } else {
                    ApplyProfileChanges.push({
                        "changeType": "itemQuantityChanged",
                        "itemId": key,
                        "quantity": item.quantity
                    })
                }

                if (remainingAmount === 0) break;
            }
        }
    }
}