const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/User')

usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('favProducts',
    { name: 1, price: 1, imageUrl: 1, description: 1 })
  response.json(users)
})

usersRouter.post('/', async (request, response) => {
  try {
    const { body } = request
    const { username, name, password, email, role, favProducts } = body

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)
    const user = new User({
      username,
      name,
      passwordHash,
      email,
      role,
      favProducts
    })

    const savedUser = await user.save()

    response.status(201).json(savedUser)
  } catch (error) {
    response.status(400).json({
      error
    })
  }
})

// get a single user
usersRouter.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id)
  if (user) {
    res.json(user)
  } else {
    res.status(404).json({ message: 'User not found' })
  }
})

// update a user
usersRouter.put('/:id', (req, res) => {
  const { id } = req.params
  const user = req.body

  const newUser = {
    name: user.name,
    username: user.username,
    hashPassword: user.hashPassword,
    email: user.email,
    role: user.role
  }

  User.findByIdAndUpdate(id, newUser, { new: true })
    .then(result => {
      res.json(result)
    }
    )
})

// delete a user
usersRouter.delete('/:id', async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id)
  res.json(user)
})

// get users by role
usersRouter.get('/:role', async (req, res) => {
  const users = await User.find({ role: req.params.role })
  res.json(users)
})

module.exports = usersRouter
