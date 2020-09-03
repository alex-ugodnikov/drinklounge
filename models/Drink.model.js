const { Schema, model } = require('mongoose');

const drinkSchema = new Schema(
  {
    drinkId: { type: Number },
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    rating: { type: Number, default: 0}
  },
  {
    timestamps: true
  }
);

module.exports = model('Drink', drinkSchema);
