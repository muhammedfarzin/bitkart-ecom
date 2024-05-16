import fs from "fs"
import ProductModel from "../models/product-model.js";
import { Types } from "mongoose"

const productStatuslist = ['active', 'inactive', 'sold out'];

const productController = {
    addProduct: (datas) => {
        return new Promise((resolve, reject) => {
            const { title, description, price, offerPrice, category: categoryId, quantity } = datas.body;
            const imagePaths = datas.files.map(image => image.path.replace('public', ''));
            const product = new ProductModel({ title, description, price, offerPrice, categoryId, quantity, imagePaths });
            product.save()
                .then(data => {
                    resolve(data);
                })
                .catch(err => {
                    imagePaths.forEach(imagePath => {
                        fs.unlink('public' + imagePath, (err) => {
                            if (err) console.log('Image is not deleted: ' + err.message);
                        });
                    });
                    if (err.errors) {
                        reject(product.invalidDataCustomError(err));
                    } else {
                        reject(err);
                    }
                })
        })
    },
    getProductById: async (id) => {
        try {
            const product = await ProductModel.findById(id)
            if (!product) throw new Error('Invalid product');
            return product.toObject();
        } catch (err) {
            throw new Error('Invalid product');
        }
    },
    searchProducts: async (searchQuery) => {
        try {
            let products = await ProductModel.find({
                $or: [
                    { title: { $regex: searchQuery, $options: 'i' } },
                    { description: { $regex: searchQuery, $options: 'i' } },
                ]
            });
            if (!products.length) products = [await ProductModel.findById(searchQuery)];
            return products.map(user => user.toObject());
        } catch (err) {
            return [];
        }
    },
    getProducts: async () => {
        const products = await ProductModel.find().limit(20);
        return products.map(product => product.toObject());
    },
    getProductsByCategory: async (categoryId) => {
        const products = await ProductModel.find({ categoryId: categoryId }).limit(20);
        return products.map(product => product.toObject());
    },
    updateProduct: (productId, req) => {
        return new Promise(async (resolve, reject) => {
            try {
                const { title, description, price, offerPrice, category, quantity, status } = req.body;
                if (!productStatuslist.includes(status)) throw new Error('Invalid status');
                const imagePaths = req.files.length > 0 ? req.files.map(image => image.path.replace('public', '')) : undefined;
                const currentImagePaths = (await productController.getProductById(productId)).imagePaths;
                ProductModel.findByIdAndUpdate(productId, { title, description, price, offerPrice, category, quantity, status, imagePaths })
                    .then(data => {
                        if (imagePaths?.length && currentImagePaths?.length) currentImagePaths.map(imagePath => fs.unlink('public' + imagePath, (err) => {
                            if (err) console.log('Image is not deleted');
                        }));
                        resolve(data);
                    })
            } catch (err) {
                reject(err);
            }
        });
    },
    getProductOverview: (productId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const product = await ProductModel.aggregate([
                    { $match: { _id: Types.ObjectId.createFromHexString(productId) } },
                    { $addFields: { categoryId: { $toObjectId: '$categoryId' } } }, // Convert categoryId to ObjectId
                    {
                        $lookup: {
                            from: 'categories',
                            localField: 'categoryId',
                            foreignField: '_id',
                            as: 'category'
                        }
                    },
                    {
                        $lookup: {
                            from: 'productReviews',
                            let: { productId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { $eq: [{ $toString: '$productId' }, { $toString: '$$productId' }] }
                                    },
                                },
                                { $addFields: { userId: { $toObjectId: '$userId' } } },
                                {
                                    $lookup: {
                                        from: 'users',
                                        localField: 'userId',
                                        foreignField: '_id',
                                        as: 'user'
                                    }
                                },
                                { $addFields: { user: { $arrayElemAt: ['$user', 0] } } }
                            ],
                            as: 'reviews'
                        }
                    },
                    {
                        $addFields: {
                            category: { $arrayElemAt: ['$category', 0] },  // Extract the first element from the 'category' array
                            rating: { $avg: '$reviews.starRating' },
                            totalReviews: { $size: '$reviews' }
                        }
                    }
                ]);
                console.log(product[0].reviews);
                console.log('2', product[0]);
                resolve(product[0]);
            } catch (err) {
                reject(err);
            }
        })
    }
};

export default productController;