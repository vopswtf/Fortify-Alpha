const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
    accountId: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true }, // bcrypt
    cloudStorage: { type: Object, required: true, default: {} },
}, {
    collection: "users",
    versionKey: false
});

const UserModel = model('userSchema', UserSchema);

module.exports = UserModel;