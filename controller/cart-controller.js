import UserModel from "../models/user-model.js";
import productController from "./product-controller.js";

const cartController = {
    updateCart: async (userId, productId, quantity) => {
        if (quantity) {
            quantity = parseInt(quantity);
            if (isNaN(quantity)) throw new Error('Invalid quantity');
            if (quantity > 10) throw new Error('Sorry, you can only purchase up to 10 units of the same product at a time');
            if (quantity <= 0) {
                return await UserModel.findByIdAndUpdate(
                    userId,
                    { $pull: { cart: { productId } } },
                    { new: true }
                );
            }
        }
        const product = await productController.getProductById(productId);
        const user = await UserModel.findById(userId);
        const cartIndex = user.cart.findIndex(data => data.productId == productId);
        if (product.quantity < (quantity ?? (user.cart[cartIndex]?.quantity + 1))) {
            throw new Error(`Only ${product.quantity} quantity left for this product`);
        }

        if (cartIndex != -1) {
            user.cart[cartIndex].quantity = quantity ?? user.cart[cartIndex].quantity + 1;
        } else {
            user.cart.push({ productId, quantity });
        }
        return await user.save();
    },
    getCartProducts: async (userId) => {
        const cartProducts = (await UserModel.aggregate([
            { $match: { _id: userId } },
            { $project: { _id: 0, cart: 1 } },
            { $unwind: '$cart' },
            { $replaceRoot: { newRoot: '$cart' } },
            { $addFields: { productId: { $toObjectId: '$productId' } } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $addFields: { productDetails: { $arrayElemAt: ['$productDetails', 0] } } }
        ]));
        return cartProducts;
    },
    getPriceSummary: async (userId, datas) => {
        if (!datas) {
            datas = await cartController.getCartProducts(userId);
        }

        let totalPrice = 0;
        let deliveryCharge = 49;
        datas.forEach(data => {
            const { price, offerPrice } = data.productDetails;
            totalPrice += (offerPrice ?? price) * data.quantity;
        });
        if (totalPrice >= 500) deliveryCharge = 0;
        return { totalPrice, deliveryCharge };
    },
}

export default cartController;