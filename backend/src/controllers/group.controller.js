import { userAndGroupEditAllowed, updateGuestGroup } from '../core/permissions';
import GroupModel from '../models/group.model';
import UserGroupModel from '../models/user_group.model';

exports.get_groups = async (req, res) => {
  if (!userAndGroupEditAllowed(req.user)) {
    res.json({ success: false, error: "You are not allowed to see the full group list." });
    return;
  }
  try {
    const groups = await GroupModel.find()
      .collation({ locale:'en', strength: 2 })
      .sort({ name: 1 })
      .exec();
    res.json({ success: true, data: groups });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.get_group = async (req, res) => {
  const { groupId } = req.params;
  if (typeof(groupId) != 'string' || !groupId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong group id" });
    return;
  }
  try {
    const group = await GroupModel.findById(groupId);
    if (group == null)
      res.json({ success: false, error: "Group not found" });
    else
      res.json({ success: true, data: group });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.new_group = async (req, res) => {
  if (!userAndGroupEditAllowed(req.user)) {
    res.json({ success: false, error: "You are not allowed to create a new group." });
    return;
  }
  try {
    const group = await GroupModel.create(req.body);
    group.users = [];
    res.json({ success: true, data: group });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.remove_group = async (req, res) => {
  const { groupId } = req.params;
  if (typeof(groupId) != 'string' || !groupId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong group id" });
    return;
  }
  if (!userAndGroupEditAllowed(req.user)) {
    res.json({ success: false, error: "You are not allowed to remove a group." });
    return;
  }
  try {
    const group = await GroupModel.findById(groupId);
    if (group == null) {
      res.json({ success: false, error: "Group not found" });
      return;
    }
    if (group.name == 'Superusers' || group.name == 'Guests') {
      res.json({ success: false,
        error: "It is not possible to remove the Superusers or the Guests groups." });
      return;
    }
    await UserGroupModel.deleteMany({ groupId }).exec();
    await GroupModel.findByIdAndRemove(groupId).exec();
    res.json({ success: true, data: {} });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.update_group = async (req, res) => {
  const { groupId } = req.params;
  if (typeof(groupId) != 'string' || !groupId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong group id" });
    return;
  }
  if (!userAndGroupEditAllowed(req.user)) {
    res.json({ success: false, error: "You are not allowed to update a group." });
    return;
  }
  const oldGroup = await GroupModel.findById(groupId);
  if (oldGroup == null) {
    res.json({ success: false, error: "Group not found" });
    return;
  }
  if (oldGroup.name == 'Superusers') {
    res.json({ success: false, error: "The Superusers group cannot be modified." });
    return;
  }
  const group = req.body;
  try {
    await GroupModel.findByIdAndUpdate(groupId, group).exec();
    if (group.name == 'Guests')
      updateGuestGroup(group);
    res.json({ success: true, data: {} });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.add_user = async (req, res) => {
  const { groupId, userId } = req.params;
  if (typeof(groupId) != 'string' || !groupId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong group id" });
    return;
  }
  if (typeof(userId) != 'string' || !userId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong user id" });
    return;
  }
  if (!userAndGroupEditAllowed(req.user)) {
    res.json({ success: false, error: "You are not allowed to edit groups." });
    return;
  }
  const group = await GroupModel.findById(groupId);
  if (group == null) {
    res.json({ success: false, error: "Group not found" });
    return;
  }
  if (group.name == 'Guests' || group.name == 'Authenticated') {
    res.json({ success: false, error: "You can't add a user to the this group." });
    return;
  }
  try {
    await UserGroupModel.create({ groupId, userId });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.remove_user = async (req, res) => {
  const { groupId, userId } = req.params;
  if (typeof(groupId) != 'string' || !groupId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong group id" });
    return;
  }
  if (typeof(userId) != 'string' || !userId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong user id" });
    return;
  }
  if (!userAndGroupEditAllowed(req.user)) {
    res.json({ success: false, error: "You are not allowed to edit groups." });
    return;
  }
  const group = await GroupModel.findById(groupId);
  if (group == null) {
    res.json({ success: false, error: "Group not found" });
    return;
  }
  if (group.name == 'Superusers') {
    // check that there will be at least one superuser left
    try {
      const suCount = await UserGroupModel.count({ groupId });
      if (suCount < 2)
        throw new Error("You can't remove the last superuser !");
    } catch (err) {
      res.json({ success: false, error: err.message });
      return;
    }
  }
  try {
    await UserGroupModel.findOneAndRemove({ groupId, userId });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};
