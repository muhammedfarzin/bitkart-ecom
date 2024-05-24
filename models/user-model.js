import { Schema, model } from "mongoose"
import bcrypt from "bcrypt";
import addressSchema from "./schemas/address-schema.js";

const cartSchema = new Schema({
    productId: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        default: 1,
    }
});

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    cart: {
        type: [cartSchema]
    },
    address: {
        type: [addressSchema]
    },
    wishlist: {
        type: [String]
    },
    orders: {
        type: [String]
    },
    status: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    }
});

cartSchema.pre('save', function (next) {
    if (this.quantity > 10) throw new Error('Sorry, you can only purchase up to 10 units of the same product at a time');
    next();
});

userSchema.pre('save', async function (next) {
    if (this.isModified('password') || this.isNew) {
        this.password = await bcrypt.hash(this.password, 10)
    }

    next();
})

userSchema.methods.comparePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

userSchema.methods.customError = function (err) {
    if (err.code === 11000 && err.keyPattern.email) {
        return new Error("This email address is already in use.");
    } else if (err.code === 11000 && err.keyPattern.mobile) {
        return new Error("This mobile number is already in use.");
    } else {
        return err;
    }
}

const UserModel = model('user', userSchema, 'users')

export default UserModel;