import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const DomainsSchema = new Schema({
  auditId: { type: Schema.Types.ObjectId, ref: 'Audit', index: true },
  name: String,
  nbCheckedURLs: Number,
  nbViolations: Number,
  violationStats: { // the key is the violation id
    type: Map,
    of: {
      description: String,
      descLink: String,
      impact: String,
      total: Number,
      pages: [{
        id: { type: Schema.Types.ObjectId, ref: 'Page' },
        count: Number,
      }],
    },
    default: {},
  },
  categories: { // the key is the category name, the value is the count
    type: Map,
    of: Number,
    default: {},
  },
}, { timestamps: true });

DomainsSchema.virtual('pages', {
  ref: 'Page',
  localField: '_id',
  foreignField: 'domainId'
});

DomainsSchema.set('toObject', { virtuals: true });
DomainsSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Domain', DomainsSchema);
