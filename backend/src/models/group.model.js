import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  name: {
    type: String,
    index: true,
    unique: true,
  },
  permissions: {
    createAllAudits: Boolean,
    readAllAudits: Boolean,
    deleteAllAudits: Boolean,
    editUsersAndGroups: Boolean,
    domains: [{
      name: String,
      read: Boolean,
      delete: Boolean,
      create: Boolean,
    }],
  },
}, { timestamps: true });

groupSchema.virtual('users', {
  ref: 'UserGroup',
  localField: '_id',
  foreignField: 'groupId'
});

groupSchema.set('toObject', { virtuals: true });
groupSchema.set('toJSON', { virtuals: true });

// see https://stackoverflow.com/questions/46019149/many-to-many-with-mongoose
const userLookup = {
  from: 'usergroups',
  let: { id: '$_id' },
  pipeline: [
    {
      $match: { $expr: { $eq: [ '$$id', '$groupId' ] } }
    },
    {
      $lookup: {
        from: 'users',
        let: { userId: '$userId' },
        pipeline: [
          { $match: { $expr: { $eq: [ '$_id', '$$userId' ] } } }
        ],
        as: 'users'
      }
    },
    { $unwind: '$users' },
    { $replaceRoot: { newRoot: '$users' } }
  ],
  as: 'users',
};

groupSchema.statics.findById = async function(id) {
  const groups = await this.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(id) } },
    { $lookup: userLookup },
    { $project: { name: 1, permissions: 1, users: 1 } },
  ]).exec();
  if (groups.length == 1)
    return groups[0];
  return null;
};

groupSchema.statics.createGuestGroup = async function() {
  const gg = await this.create({
    name: 'Guests',
    permissions: {
      createAllAudits: false,
      readAllAudits: true,
      deleteAllAudits: false,
      editUsersAndGroups: false,
      domains: [],
    }
  });
  return gg;
};

// NOTE: we can't use an arrow function here because we will need "this"
groupSchema.statics.getGuestGroup = async function() {
  try {
    const group = await this.findOne({
      name: 'Guests',
    }).exec();
    return group;
  } catch (err) {
    console.error("Error when looking for the Guests group:");
    console.error(err);
    return null;
  }
};

groupSchema.statics.getAuthenticatedGroup = async function() {
  try {
    const group = await this.findOne({
      name: 'Authenticated',
    }).exec();
    return group;
  } catch (err) {
    console.error("Error when looking for the Authenticated group:");
    console.error(err);
    return null;
  }
};

groupSchema.statics.createAuthenticatedGroup = async function() {
  const group = await this.create({
    name: 'Authenticated',
    permissions: {
      createAllAudits: false,
      readAllAudits: true,
      deleteAllAudits: false,
      editUsersAndGroups: false,
      domains: [],
    }
  });
  return group;
};

groupSchema.statics.getSuperuserGroup = async function() {
  const groups = await this.aggregate([
    { $match: { name: 'Superusers' } },
    { $lookup: userLookup },
  ]).exec();
  if (groups.length == 1)
    return groups[0];
  return null;
};

export default mongoose.model('Group', groupSchema);
