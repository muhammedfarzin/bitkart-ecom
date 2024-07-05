import fs from "fs"
import ProductModel from "../models/product-model.js";
import { Types } from "mongoose"
import CategoryModel from "../models/category-model.js";

const productStatuslist = ['active', 'inactive', 'sold out'];

function validateOffer(price, offerPrice) {
    price = Number(price);
    offerPrice = Number(offerPrice);
    if (isNaN(price) || isNaN(offerPrice)) throw new Error('Invalid price or offer price');
    if (price < offerPrice) throw new Error('Price cannot less than offer price');
    if (price == offerPrice) return { price, offerPrice: null };
    return { price, offerPrice };
}

const productController = {
    addProduct: (datas) => {
        return new Promise((resolve, reject) => {
            const { title, description, category: categoryId, quantity } = datas.body;
            const { price, offerPrice } = validateOffer(datas.body.price, datas.body.offerPrice);
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
    getProductByIds: async (productIds) => {
        const products = await ProductModel.aggregate([
            { $match: { _id: { $in: productIds } } },
            {
                $lookup: {
                    from: 'reviews',
                    let: { productId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: [{ $toString: '$productId' }, { $toString: '$$productId' }] }
                            },
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'userId',
                                foreignField: '_id',
                                as: 'user'
                            }
                        },
                        {
                            $addFields: {
                                userId: { $toObjectId: '$userId' },
                                user: { $arrayElemAt: ['$user', 0] },
                            }
                        },
                    ],
                    as: 'reviews'
                }
            },
            {
                $addFields: {
                    rating: { $avg: '$reviews.starRating' },
                    totalReviews: { $size: '$reviews' }
                }
            }
        ]);
        return products;
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
    searchUserProducts: async (data) => {
        const sortMethods = {
            newArrival: { createdAt: -1 },
            priceAtoZ: { sortField: 1 },
            priceZtoA: { sortField: -1 }
        }
        try {
            const page = parseInt(data.page) || 1;
            const limit = 20;
            const skip = (page - 1) * limit;

            const sort = data.sort || 'newArrival';
            const searchQuery = data.search || /.*/;
            const minAmount = data.minAmount ? Number(data.minAmount) : 1;
            const maxAmount = data.maxAmount ? Number(data.maxAmount) : Number.POSITIVE_INFINITY;
            const products = await ProductModel.aggregate([
                {
                    $match: {
                        $or: [
                            { title: { $regex: searchQuery, $options: 'i' } },
                            { description: { $regex: searchQuery, $options: 'i' } },
                        ],
                        categoryId: data.categories ? { $in: data.categories } : /.*/,
                    }
                },
                {
                    $match: {
                        $or: [
                            { price: { $lte: maxAmount, $gte: minAmount } },
                            { offerPrice: { $lte: maxAmount, $gte: minAmount } }
                        ]
                    }
                },
                {
                    $addFields: {
                        sortField: {
                            $cond: {
                                if: { $or: [{ $eq: ["$offerPrice", null] }, { $eq: ["$offerPrice", 0] }] },
                                then: "$price",
                                else: "$offerPrice"
                            }
                        }
                    }
                },
                { $sort: sortMethods[sort] },
                { $project: { sortField: 0 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'reviews',
                        let: { productId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: [{ $toString: '$productId' }, { $toString: '$$productId' }] }
                                },
                            },
                            {
                                $lookup: {
                                    from: 'users',
                                    localField: 'userId',
                                    foreignField: '_id',
                                    as: 'user'
                                }
                            },
                            {
                                $addFields: {
                                    userId: { $toObjectId: '$userId' },
                                    user: { $arrayElemAt: ['$user', 0] },
                                }
                            },
                        ],
                        as: 'reviews'
                    }
                },
                {
                    $addFields: {
                        rating: { $avg: '$reviews.starRating' },
                        totalReviews: { $size: '$reviews' }
                    }
                }
            ]);

            const totalCount = await ProductModel.countDocuments({
                $and: [
                    {
                        $or: [
                            { title: { $regex: searchQuery, $options: 'i' } },
                            { description: { $regex: searchQuery, $options: 'i' } },
                        ]
                    },
                    {
                        $or: [
                            { price: { $lte: maxAmount, $gte: minAmount } },
                            { offerPrice: { $lte: maxAmount, $gte: minAmount } }
                        ]
                    }
                ],
                categoryId: data.categories ? { $in: data.categories } : /.*/,
            });
            const totalPages = Math.ceil(totalCount / limit);

            return { products, totalPages, currentPage: page };
        } catch (err) {
            return [];
        }
    },
    getProducts: async (findQuery, limit) => {
        const products = await ProductModel.find(findQuery).limit(limit || 20);
        return products.map(product => product.toObject());
    },
    getProductsByCategory: async (categoryId) => {
        const products = await ProductModel.find({ categoryId: categoryId }).limit(20);
        return products.map(product => product.toObject());
    },
    updateProduct: (productId, req) => {
        return new Promise(async (resolve, reject) => {
            try {
                const { title, description, category: categoryId, quantity, status } = req.body;
                const { price, offerPrice } = validateOffer(req.body.price, req.body.offerPrice);
                if (!productStatuslist.includes(status)) throw new Error('Invalid status');

                const categoryData = await CategoryModel.findById(categoryId);
                if (!categoryData) throw new Error('You entered category is not exist');

                const imagePaths = req.files.length > 0 ? req.files.map(image => image.path.replace('public', '')) : undefined;
                const currentImagePaths = (await productController.getProductById(productId)).imagePaths;
                ProductModel.findByIdAndUpdate(productId, { title, description, price, offerPrice, categoryId, quantity, status, imagePaths })
                    .then(data => {
                        if (imagePaths?.length && currentImagePaths?.length) currentImagePaths.map(imagePath => fs.unlink('public' + imagePath, (err) => {
                            if (err) console.log('Image is not deleted');
                        }));
                        resolve(data);
                    });
            } catch (err) {
                if (err.name == 'CastError' && err.kind == 'ObjectId') {
                    reject(new Error(`You entered ${err.model.modelName} is not exist`));
                } else {
                    reject(err);
                }
            }
        });
    },
    getProductOverview: (productId) => {
        return new Promise(async (resolve, reject) => {
            try {
                productId = Types.ObjectId.createFromHexString(productId);
                const product = await ProductModel.aggregate([
                    { $match: { _id: productId } },
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
                            from: 'reviews',
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
                resolve(product[0]);
            } catch (err) {
                if (err.name === 'BSONError') {
                    reject(new Error('Product not found'));
                } else {
                    reject(err);
                }
            }
        })
    }
};

export default productController;