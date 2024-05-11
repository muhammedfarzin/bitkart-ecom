import fs from "fs";
import CategoryModel from "../model/category-model.js";

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
        const datas = await CategoryModel.find()
            .limit(20);
        return datas;
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
        const datas = await CategoryModel.find()
            .select('title');
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
                .catch(err => reject(err));
        })
    }
};

export default categoryController;