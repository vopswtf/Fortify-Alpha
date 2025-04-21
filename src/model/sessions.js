const { Schema, model } = require('mongoose');

const SessionSchema = new Schema({
    id: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true },
    ownerName: { type: String, required: true },
    serverName: { type: String, required: true },
    maxPublicPlayers: { type: Number, required: true },
    maxPrivatePlayers: { type: Number, required: true },
    shouldAdvertise: { type: Boolean, required: true },
    allowJoinInProgress: { type: Boolean, required: true },
    isDedicated: { type: Boolean, required: true },
    usesStats: { type: Boolean, required: true },
    allowInvites: { type: Boolean, required: true },
    usesPresence: { type: Boolean, required: true },
    allowJoinViaPresence: { type: Boolean, required: true },
    allowJoinViaPresenceFriendsOnly: { type: Boolean, required: true },
    buildUniqueId: { type: String, required: true },
    attributes: { type: Object, required: true },
    serverPort: { type: Number, required: true },
    openPrivatePlayers: { type: Number, required: true },
    openPublicPlayers: { type: Number, required: true },
    sortWeight: { type: Number, required: true },
    publicPlayers: { type: [String], required: true },
    privatePlayers: { type: [String], required: true },
    serverAddress: { type: String, required: true },
    started: { type: Boolean, required: true }
}, {
    collection: "gameSessions",
    versionKey: false,
    timestamps: { createdAt: false, updatedAt: "lastUpdated" }
});

SessionSchema.index({ lastUpdated: 1 }, { expireAfterSeconds: 45 });

SessionSchema.pre('save', function (next) {
    this.session.privatePlayers = [...new Set(session.privatePlayers)];
    this.session.publicPlayers = [...new Set(session.publicPlayers)];

    this.session.totalPlayers = session.privatePlayers.length + session.publicPlayers.length;
    this.session.openPrivatePlayers = session.maxPrivatePlayers - session.privatePlayers.length;
    this.session.openPublicPlayers = session.maxPublicPlayers - session.publicPlayers.length;

    next();
});

module.exports = model('sessionSchema', SessionSchema)