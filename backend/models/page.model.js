import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const PagesSchema = new Schema({
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'Audit' },
  domainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain' },
  url: String,
  status: String,
  errorMessage: String,
  nbViolations: Number,
  violations: [{ id: String, description: String, descLink: String,
    impact: String, nodes: [{ target: String, html: String }] }],
}, { timestamps: true });

export default mongoose.model('Page', PagesSchema);
