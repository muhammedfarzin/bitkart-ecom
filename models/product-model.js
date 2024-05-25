import { Schema, model } from "mongoose";

const productSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Please enter title']
    },
    description: {
        type: String,
        required: [true, 'Please enter description'],
    },
    price: {
        type: Number,
        required: [true, 'Please enter price'],
        min: [10, 'Price must be atlest 10 rupees']
    },
    offerPrice: {
        type: Number,
        min: [10, 'Offer price must be atlest 10 rupees']
    },
    categoryId: {
        type: String,
        required: [true, 'Please select a category']
    },
    quantity: {
        type: Number,
        required: [true, 'Please enter quantity'],
        min: [0, 'Quantity cannot be less than zero'],
        max: [500, 'Maximum 500 quantity is allowed']
    },
    imagePaths: {
        type: [String],
        required: [true, 'Upload atleast 3 images'],
        validate: [
            {
                validator: function (v) {
                    return v.length <= 5;
                },
                message: 'Maximum 5 images can be uploaded'
            },
            {
                validator: function (v) {
                    return v.length >= 3;
                },
                message: 'Upload atleast 3 images'
            }
        ]
    },
    status: {
        type: String,
        default: 'active'
    },
    reviews: [String]
});

productSchema.pre('save', function (next) {
    if (this.price < this.offerPrice) {
        throw new Error('Offer price must be less than the actual price');
    }
    (this.quantity <= 0) ? this.status = 'sold out' : this.status = 'active';
    next();
});

productSchema.pre(['updateOne', 'findOneAndUpdate'], async function (next) {
    const update = this.getUpdate();
    if (update.$set) {
        if (update.$set.quantity <= 0) update.$set.status = 'sold out';
    } else if (update.$inc) {
        const quantity = (await this.model.findOne(this.getQuery())).quantity;
        if ((quantity + update.$inc.quantity) <= 0) {
            update.$set = update.$set || {};
            update.$set.status = 'sold out';
        }
    }

    next();
});

productSchema.methods.invalidDataCustomError = function (err) {
    // Extract error messages
    const errorMessages = err.errors;
    // Format error messages
    let formattedErrorMessages = '';
    Object.keys(errorMessages).forEach((field) => {
        formattedErrorMessages += `${errorMessages[field].message}, `;
    });
    formattedErrorMessages = formattedErrorMessages.slice(0, -2);
    // Return the error messages
    return new Error(formattedErrorMessages);
}

const ProductModel = model('product', productSchema, 'products');

export default ProductModel;