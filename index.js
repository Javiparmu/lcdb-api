require('dotenv').config()
require('./mongo')
const notFound = require('./middleware/notFound.js')
const handleErrors = require('./middleware/handleErrors.js')
const UserExtractor = require('./middleware/userExtractor.js')
const express = require('express')
const cors = require('cors')
const Product = require('./models/product')
const User = require('./models/User')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const testingRouter = require('./controllers/testing')
const app = express()

app.use(cors())
app.use(express.json())

// get all products
app.get('/api/products', async (req, res) => {
  const products = await Product.find({})
  res.json(products)
})

// get a single product
app.get('/api/products/:id', async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (product) {
    res.json(product)
  } else {
    res.status(404).json({ message: 'Product not found' })
  }
})

app.get('/api/products/type/:type', async (req, res) => {
  const product = await Product.find({ type: req.params.type })
  if (product) {
    res.json(product)
  } else {
    res.status(404).json({ message: 'Product not found' })
  }
})

// get popular products
app.get('/api/popular', async (req, res, next) => {
  try {
    const products = await Product.find({ popular: true })
    res.json(products)
  } catch (err) {
    next(err)
  }
})

// set a product as popular
app.post('/api/products/:id/popular', async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (product) {
    product.popular = true
    await product.save()
    res.json(product)
  } else {
    res.status(404).json({ message: 'Product not found' })
  }
})

// get products by tag
app.get('/api/products/tag/:tag', async (req, res) => {
  const products = await Product.find({ tags: req.params.tag })
  res.json(products)
})

// get product by type
app.get('/api/products/type/:type', async (req, res) => {
  const products = await Product.find({ type: req.params.type })
  res.json(products)
})

// get clicks of a product
app.get('/api/products/:id/clicks', async (req, res) => {
  const product = await Product.findById(req.params.id)
  res.json(product.clicks)
})

// click a product
app.post('/api/products/:id/clicks', async (req, res) => {
  const product = await Product.findById(req.params.id)
  product.clicks++
  await product.save()
  res.json(product.clicks)
})

// create a new product
app.post('/api/products', async (req, res) => {
  const { name, type, popular, clicks, price, description, images, tags, favCount } = req.body
  const product = new Product({
    name,
    type,
    popular,
    clicks,
    price,
    description,
    images,
    tags,
    favCount
  })
  await product.save()
  res.status(201).json(product)
})

// update a product
app.put('/api/products/:id', UserExtractor, (req, res) => {
  const { id } = req.params
  const product = req.body

  const newProduct = {
    name: product.name,
    type: product.type,
    popular: product.popular,
    clicks: product.clicks,
    price: product.price,
    description: product.description,
    images: product.images,
    tags: product.tags,
    favCount: product.favCount
  }

  Product.findByIdAndUpdate(id, newProduct, { new: true })
    .then(result => {
      res.json(result)
    }
    )
})

// update all products of a type
app.put('/api/products/type/:type', UserExtractor, (req, res) => {
  const { type } = req.params
  const product = req.body

  const newProduct = {
    name: product.name,
    type: product.type,
    popular: product.popular,
    clicks: product.clicks,
    price: product.price,
    description: product.description,
    images: product.images,
    tags: product.tags,
    favCount: product.favCount
  }

  const results = []

  Product.find({ type })
    .then(result => {
      result.forEach(product => {
        Product.findByIdAndUpdate(product._id, newProduct, { new: true })
          .then(result => {
            results.concat(result)
          })
      })
    })
  res.json(results)
})

app.post('/api/products/:id/favorite', UserExtractor, async (req, res) => {
  const { favCount } = req.body
  const id = req.params.id

  const { userId } = req
  const user = await User.findById(userId)

  const newProduct = {
    favCount
  }

  const product = await Product.findByIdAndUpdate(id, newProduct, { new: true })

  user.favProducts = [...user.favProducts, product]
  await user.save()

  res.status(201).json(product)
})

app.post('/api/products/:id/unfavorite', UserExtractor, async (req, res) => {
  const { favCount } = req.body
  const id = req.params.id

  const { userId } = req
  const user = await User.findById(userId)

  const newProduct = {
    favCount
  }

  const product = await Product.findByIdAndUpdate(id, newProduct, { new: true })

  user.favProducts = user.favProducts.filter(product => product._id.toString() !== id)
  await user.save()

  res.status(201).json(product)
})

// get favorite count of a product
app.get('/api/products/:id/favorite', async (req, res) => {
  const product = await Product.findById(req.params.id)
  res.json(product.favCount)
})

// delete product
app.delete('/api/products/:id', async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id)
  res.json(product)
})

app.get('/api/products/images/type/:type', async (req, res) => {
  let imageAndIdArray = []
  const imageAndId = []
  const products = await Product.find({ type: req.params.type })
  const images = products.map(product => {
    imageAndIdArray.push(product.images.sort(() => Math.random() - 0.5)[0])
    imageAndIdArray.push(product.id)
    imageAndId.push(imageAndIdArray)
    imageAndIdArray = []
    return imageAndId
  })
  const randInd = Math.floor(Math.random() * images.length)
  const randInd2 = Math.floor(Math.random() * images[0].length)
  res.json(images[randInd][randInd2])
})

app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)

if (process.env.NODE_ENV === 'test') {
  app.use('/api/testing', testingRouter)
}

app.use(notFound)

app.use(handleErrors)

const PORT = process.env.PORT

const server = app.listen(PORT, () => {
  console.log('Server running')
})

module.exports = { app, server }
