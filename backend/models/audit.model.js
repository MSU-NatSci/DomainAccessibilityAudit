import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const AuditsSchema = new Schema({
  firstURL: String,
  standard: String,
  checkSubdomains: Boolean,
  maxDepth: Number,
  browser: String,
  dateStarted: Date,
  dateEnded: Date,
  nbCheckedURLs: Number,
  nbViolations: Number,
  nbScanErrors: Number,
  initialDomainName: String,
  violationStats: { // the key is the violation id
    type: Map,
    of: {
      description: String,
      descLink: String,
      impact: String,
      total: Number,
      domains: [{
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain' },
        count: Number,
      }],
    },
    default: {},
  },
  complete: Boolean,
}, { timestamps: true });

AuditsSchema.virtual('domains', {
  ref: 'Domain',
  localField: '_id',
  foreignField: 'auditId'
});

AuditsSchema.set('toObject', { virtuals: true });
AuditsSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Audit', AuditsSchema);
