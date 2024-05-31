import fs from "fs";
import CategoryModel from "../models/category-model.js";

const categoryController = {
    createCategory: (datas) => {
        return new Promise((resolve, reject) => {
            const imagePath = datas.file.path.replace('public', '');
            const { title, description } = datas.body;
            if (!title && !description) {
                return reject(new Error('Please enter title and description'));
            }

            const category = new CategoryModel({ title, description, imagePath });
            category.save()
                .then(data => resolve(data))
                .catch(err => {
                    fs.unlink('public' + imagePath, (err => {
                        if (err) console.log('Image is not deleted: ' + err.message);
                    }))
                    reject(err)
                });
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
                ]
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
        return new Promise((resolve, reject) => {
            const imagePath = datas.file?.path.replace('public', '');
            if (imagePath) fs.unlinkSync('public' + datas.body.currentImage)
            const { title, description } = datas.body;
            if (!title && !description) {
                return reject(new Error('Please enter title and description'));
            }
            CategoryModel.findByIdAndUpdate(id, { title, description, imagePath })
                .then(data => resolve(data))
                .catch(err => {
                    if (err.code == 11000 && err.codeName == 'DuplicateKey') {
                        reject(new Error(`${err.keyValue.title} is already exist`));
                    } else {
                        reject(err);
                    }
                });
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