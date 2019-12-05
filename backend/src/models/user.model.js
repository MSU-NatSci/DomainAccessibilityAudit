import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    index: true,
    unique: true,
  },
  firstname: String,
  lastname: String,
  password: String,
}, { timestamps: true });

UserSchema.virtual('groups', {
  ref: 'UserGroup',
  localField: '_id',
  foreignField: 'userId'
});

UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });

// see https://stackoverflow.com/questions/46019149/many-to-many-with-mongoose
const groupLookup = {
  from: 'usergroups',
  let: { id: '$_id' },
  pipeline: [
    {
      $match: { $expr: { $eq: [ '$$id', '$userId' ] } }
    },
    {
      $lookup: {
        from: 'groups',
        let: { groupId: '$groupId' },
        pipeline: [
          { $match: { $expr: { $eq: [ '$_id', '$$groupId' ] } } }
        ],
        as: 'groups'
      }
    },
    { $unwind: '$groups' },
    { $replaceRoot: { newRoot: '$groups' } }
  ],
  as: 'groups',
};

UserSchema.statics.findById = async function (id) {
  const users = await this.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(id) } },
    { $lookup: groupLookup },
    { $project: { username: 1, firstname: 1, lastname: 1, groups: 1 } },
  ]).exec();
  if (users.length == 1)
    return users[0];
  return null;
};

UserSchema.statics.findByUsername = async function (username) {
  const users = await this.aggregate([
    { $match: { username: username } },
    { $lookup: groupLookup },
    { $project: { username: 1, firstname: 1, lastname: 1, password: 1, groups: 1 } },
  ]).exec();
  if (users.length == 1)
    return users[0];
  return null;
};

export default mongoose.model('User', UserSchema);
