const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const CharacterSchema = new Schema({
    profile_link: String,
    name: String
}, { strict: false });

module.exports = model('Character', CharacterSchema);