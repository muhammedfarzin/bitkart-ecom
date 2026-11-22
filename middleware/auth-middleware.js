import * as userService from "../services/user-service.js"

export function checkLogin(session) {
    if (session.admin && session.admin == process.env.ADMIN_EMAIL) {
        return true;
    } else {
        return false;
    }
};

export async function checkUserLoginStatus(req, res, next) {
    try {
        const response = await userService.checkUserStatus(req.session.user);
        if (response) {
            req.session.user = response;
            req.session.save();
            next();
        } else {
            req.session.destroy();
            res.status(302).set('Location', '/login').send();
        }
    } catch (err) {
        req.session.destroy();
        res.redirect('/login?errMessage=' + err.message);
    }
}

export function checkForUserLogin(req, res, next) {
    if (req.session.user) {
        res.redirect('/');
    } else {
        next();
    }
}

export function checkAdminLoginStatus(req, res, next) {
    if (checkLogin(req.session)) {
        next();
    } else {
        req.session.destroy();
        res.redirect('/admin/login');
    }
}