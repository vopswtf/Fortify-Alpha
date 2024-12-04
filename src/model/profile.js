const { Schema, model } = require('mongoose');

const stats = {
    templateId: "profile_v2",
    attributes: {
        level: 1,
        xp: 0,
        level_info: 0,
        commandRevision: 1,
        defaultHeroId: "",
        quest_manager: {
            dailyLoginInterval: new Date().toISOString(),
            dailyQuestRerolls: 1,
        },
        daily_rewards: {
            lastClaimDate: null,
            totalDaysLoggedIn: 1,
            nextDefaultReward: 1
        },
        gameplay_stats: []
    }
}

const ProfileSchema = new Schema({
    created: { type: String, required: true, default: new Date().toISOString() },
    updated: { type: String, required: true, default: new Date().toISOString() },
    accountId: { type: String, required: true },
    profileId: { type: String, required: true },
    rvn: { type: Number, required: true, default: 1 },
    commandRevision: { type: Number, required: true, default: 1 },
    wipeNumber: { type: Number, required: true, default: 1 },
    version: { type: String, required: true, default: "v1" },
    notifications: { type: Number, required: true, default: 0 },

    items: { type: Object, required: true, default: {} },
    stats: { type: Object, required: true, default: stats },
}, {
    collection: "profiles",
    versionKey: false,
    minimize: false
});

ProfileSchema.index({ accountId: 1, profileId: 1 }, { unique: true });

ProfileSchema.pre('save', function (next) {
    this.rvn += 1;
    this.commandRevision += 1;

    this.updated = new Date().toISOString();
    next();
});

const ProfileModel = model('profileSchema', ProfileSchema);

module.exports = ProfileModel;