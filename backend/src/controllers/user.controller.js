import { userAndGroupEditAllowed, hashUserPassword, getGuestGroup,
  authenticationMethod } from '../core/permissions';
import UserModel from '../models/user.model';
import GroupModel from '../models/group.model';
import UserGroupModel from '../models/user_group.model';

exports.get_users = async (req, res) => {
  if (!userAndGroupEditAllowed(req.user)) {
    res.json({ success: false, error: "You are not allowed to see the full user list." });
    return;
  }
  try {
    const users = await UserModel.find()
      .select('username firstname lastname')
      .collation({ locale:'en', strength: 2 })
      .sort({ lastname: 1 })
      .exec();
    res.json({ success: true, data: users });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.get_user = async (req, res) => {
  const { userId } = req.params;
  if (!userAndGroupEditAllowed(req.user)) {
    res.json({ success: false, error: "You are not allowed to get a user by id." });
    return;
  }
  if (typeof(userId) != 'string' || !userId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong user id" });
    return;
  }
  try {
    const user = await UserModel.findById(userId);
    if (user == null)
      res.json({ success: false, error: "User not found" });
    else
      res.json({ success: true, data: user });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

/*
exports.find_user = async (req, res) => {
  const { username } = req.body;
  if (!userAndGroupEditAllowed(req.user)) {
    res.json({ success: false, error: "You are not allowed to find users." });
    return;
  }
  if (typeof(username) != 'string' || !username.match(/^[0-9a-zA-Z_-]+$/)) {
    res.json({ success: false, error: "Missing or wrong username" });
    return;
  }
  try {
    const user = await UserModel.findByUsername(username);
    delete user.password; // not needed for frontend
    if (user == null)
      res.json({ success: false, error: "User not found" });
    else
      res.json({ success: true, data: user });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};
*/

exports.new_user = async (req, res) => {
  let user = {
    username: req.body.username,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    password: req.body.password,
  };
  if (!userAndGroupEditAllowed(req.user)) {
    res.json({ success: false, error: "You are not allowed to create a new user." });
    return;
  }
  try {
    await hashUserPassword(user);
    user = await UserModel.create(user);
    user = user.toObject();
    delete user.password;
    user.groups = [];
    res.json({ success: true, data: user });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.remove_user = async (req, res) => {
  const { userId } = req.params;
  if (typeof(userId) != 'string' || !userId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong user id" });
    return;
  }
  if (!userAndGroupEditAllowed(req.user)) {
    res.json({ success: false, error: "You are not allowed to remove a user." });
    return;
  }
  try {
    // check that there will be at least one superuser left
    const user = await UserModel.findById(userId);
    if (user == null) {
      res.json({ success: false, error: "User not found" });
      return;
    }
    const suGroups = user.groups.filter((g) => g.name === 'Superusers');
    if (suGroups.length > 0) {
      const suCount = await UserGroupModel.count({ groupId: suGroups[0]._id });
      if (suCount < 2)
        throw new Error("You can't remove the last superuser !");
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
    return;
  }
  try {
    await UserGroupModel.deleteMany({ userId }).exec();
    await UserModel.findByIdAndRemove(userId).exec();
    res.json({ success: true, data: {} });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.update_user = async (req, res) => {
  const { userId } = req.params;
  if (typeof(userId) != 'string' || !userId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong user id" });
    return;
  }
  if (!userAndGroupEditAllowed(req.user)) {
    res.json({ success: false, error: "You are not allowed to update users." });
    return;
  }
  const user = {
    username: req.body.username,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
  };
  try {
    if (req.body.password) {
      user.password = req.body.password;
      await hashUserPassword(user);
    }
    await UserModel.findByIdAndUpdate(userId, user).exec();
    res.json({ success: true, data: {} });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.add_group = async (req, res) => {
  const { userId, groupId } = req.params;
  if (typeof(userId) != 'string' || !userId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong user id" });
    return;
  }
  if (typeof(groupId) != 'string' || !groupId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong group id" });
    return;
  }
  if (!userAndGroupEditAllowed(req.user)) {
    res.json({ success: false, error: "You are not allowed to modify users." });
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
    await UserGroupModel.create({ userId, groupId });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.remove_group = async (req, res) => {
  const { userId, groupId } = req.params;
  if (typeof(userId) != 'string' || !userId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong user id" });
    return;
  }
  if (typeof(groupId) != 'string' || !groupId.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({ success: false, error: "Missing or wrong group id" });
    return;
  }
  if (!userAndGroupEditAllowed(req.user)) {
    res.json({ success: false, error: "You are not allowed to modify users." });
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
    await UserGroupModel.findOneAndRemove({ userId, groupId });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.get_current_user = (req, res) => {
  let user;
  if (req.user != null) {
    user = req.user;
  } else {
    const gg = getGuestGroup();
    user = {
      _id: 'guest',
      username: 'guest',
      firstname: '',
      lastname: '',
      groups: [gg],
    };
  }
  const data = {
    authenticationMethod: authenticationMethod,
    user: user,
  };
  if (req.session.authenticationError) {
    data.authenticationError = req.session.authenticationError;
    delete req.session.authenticationError;
  }
  res.json({ success: true, data: data });
};
