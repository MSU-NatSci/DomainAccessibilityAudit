import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const UserGroupSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
}, { timestamps: true });

export default mongoose.model('UserGroup', UserGroupSchema);
