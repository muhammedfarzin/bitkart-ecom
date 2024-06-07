import fs from "fs";
import CategoryModel from "../models/category-model.js";

const categoryController = {
    createCategory: (datas) => {
        return new Promise(async (resolve, reject) => {
            const imagePath = datas.file.path.replace('public', '');
            try {
                const { title, description } = datas.body;
                if (!title && !description) {
                    return reject(new Error('Please enter title and description'));
                }
                const oldCategory = await CategoryModel.findOne({ title });
                if (oldCategory && oldCategory.isDeleted) {
                    const oldImagePath = oldCategory.imagePath;
                    const response = await oldCategory.updateOne({ description, imagePath, isDeleted: false }, { new: true });
                    fs.unlink('public' + oldImagePath, (err) => err && console.log('Image is not deleted:', err.message));
                    resolve(response);
                } else {
                    const category = new CategoryModel({ title, description, imagePath });
                    const newData = await category.save();
                    resolve(newData);
                }
            } catch (err) {
                fs.unlink('public' + imagePath, (err => {
                    if (err) console.log('Image is not deleted: ' + err.message);
                }));
                if (err.code === 11000) {
                    reject(new Error(`category ${err.keyValue.title} is already exist`));
                } else {
                    reject(err);
                }
            }
        })
    },
    getCategories: async () => {
        const categories = await CategoryModel.find({ isDeleted: false }).limit(20);
        return categories.map(category => category.toObject());
    },
    searchCategories: async (searchQuery) => {
        try {
            let categories = await CategoryModel.find({
                $or: [
                    { title: { $regex: searchQuery, $options: 'i' } },
                    { description: { $regex: searchQuery, $options: 'i' } },
                ],
                isDeleted: false
            });
            if (!categories.length) categories = [await CategoryModel.findById(searchQuery)];
            return categories.map(user => user.toObject());
        } catch (err) {
            return [];
        }
    },
    getCategoryById: async (categoryId) => {
        try {
            const category = await CategoryModel.findById(categoryId);
            if (!category) throw new Error('Invalid category');
            return category.toObject();
        } catch (err) {
            throw new Error('Invalid category');
        }
    },
    getAllCategoryTitles: async () => {
        const datas = await CategoryModel.find({ isDeleted: false }).select('title');
        return datas.map(category => category.toObject());
    },
    updateCategory: (id, datas) => {
        return new Promise(async (resolve, reject) => {
            const imagePath = datas.file?.path.replace('public', '');
            const { title, description } = datas.body;
            try {
                if (!title && !description) {
                    return reject(new Error('Please enter title and description'));
                }
                const category = await CategoryModel.findById(id);
                const oldImagepath = category.imagePath;
                const response = await category.updateOne({ title, description, imagePath }, { new: true });

                if (imagePath) fs.unlink('public' + oldImagepath, (err) => err && console.error('Old image is not deleted:', err.message));
                resolve(response);
            } catch (err) {
                if (imagePath) fs.unlink('public' + imagePath, (err) => err && console.error('Image is not deleted:', err.message));
                if (err.code == 11000) {
                    reject(new Error(`category ${err.keyValue.title} is already exist`));
                } else {
                    reject(err);
                }
            }
        })
    },
    deleteCategory: async (id) => {
        try {
            const category = await CategoryModel.findByIdAndUpdate(id, { isDeleted: true });
            if (!category) throw new Error('Invalid category');
            return { message: 'Category deleted successfully' }
        } catch (err) {
            throw err;
        }
    }
};

export default categoryController;