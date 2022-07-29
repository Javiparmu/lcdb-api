const { model, Schema } = require('mongoose')

const productSchema = new Schema({
  name: String,
  type: String,
  popular: Boolean,
  clicks: Number,
  price: Number,
  description: String,
  images: [{
    type: String
  }],
  tags: [{
    type: String
  }],
  favCount: Number
})

productSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Product = model('Product', productSchema)

module.exports = Product
