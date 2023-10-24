const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const bcypt = require('bcrypt');


const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean();
    if (!users) {
        return res.status(400).json({ message: 'No users found' });
    }
    res.json(users);
})


const createNewUser = asyncHandler(async (req, res) => {
   const { username, password, roles } = req.body;
   if (!username || !password || !Array.isArray(roles) || !roles.length) {
       return res.status(400).json({ message: 'All fields are required' })
   }

   // check for duplicate usernames
   const duplicate = await User.findOne({ username }).lean().exec();

   if (duplicate) {
       return res.status(409).json({ message: 'Username already exists' });
   }

   //Hash password
   const hashedPwd = await bcypt.hash(password, 10); // salt rounds

   const userObject = {
       username,
       "password": hashedPwd,
       roles,
   }

   // Create and store new user
    const user = await User.create(userObject);

    if (user) {
        res.status(201).json({ message: `New user ${username} created successfully` });
    } else {
        res.status(400).json({ message: 'Invalid user data received' });
    }
})



const updateUser = asyncHandler(async (req, res) => {
   const { id, username, roles, active, password } = req.body;

   //Confirm data
   if (!data || !username || !Array.isArray(roles) || !roles.length ||
   typeof active !== 'boolean') {
       return res.status(400).json({ message: 'All fields are required' });
   }

   const user = await User.findById(id).exec();

   if (!user) {
       return res.status(400).json({ message: 'User not found' });
   }

   //Check for duplicate
   const duplicate = await User.findOne({ username }).lean().exec();

   //Allow updates to the original user
   if (duplicate && duplicate?._id.toString() !== id) {
       return res.status(409).json({ message: 'Username already exists' });
   }

   user.username = username;
   user.roles = roles;
   user.active = active;


   if (password) {
       // Hash password
       const hashedPwd = await bcypt.hash(password, 10); //salt rounds
       user.password = hashedPwd;
   }

   const updatedUser = await user.save();

   res.json({ message: `${updatedUser.username} updated` })
})


const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body;

    if(!id) {
        return res.status(400).json({ message: 'User ID required' });
    }

    const note = await Note.findOne({ user: id }).lean().exec();
    if (note?.length) {
        return res.status(400).json({ message: 'User has assigned notes' });
    }

    const user = await User.findById(id).exec();

    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    const result = await user.deleteOne();

    const reply = `Username ${result.username} with ID ${result._id} deleted`;

    res.json(reply);
})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser,
}
