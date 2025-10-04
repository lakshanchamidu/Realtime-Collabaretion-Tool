const { Schema, model, Types } = require('mongoose');

const docSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    owner: { type: Types.ObjectId, ref: 'User', required: true },
    editors: [{ type: Types.ObjectId, ref: 'User' }],
    viewers: [{ type: Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

module.exports = model('Document', docSchema);