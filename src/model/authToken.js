const { Schema, model } = require('mongoose');

const AuthTokenSchema = new Schema({
    identifier: { type: String, required: true },
    type: { type: String, required: true },
    token: { type: String, required: true, unique: true }
}, {
    collection: "authTokens",
    versionKey: false
});

const AuthTokenModel = model('authTokenSchema', AuthTokenSchema);

module.exports = AuthTokenModel;