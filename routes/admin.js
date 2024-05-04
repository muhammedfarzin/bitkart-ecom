import { Router } from "express";

const router = Router();

// Routes
router.get('/login', (req, res) => {
    res.render('admin/login', { title: "Admin Login" });
})


export default router;