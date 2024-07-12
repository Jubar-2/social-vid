import { check, validationResult } from "express-validator";
import { User } from "../models/users.model.js";
import { ApiError } from "../utils/ApiError.js";


const addUserValidetion = [
    check("username")
        .isLength({ min: 1 })
        .withMessage("username is required")
        .isAlpha("en-US",{ignore:" -"})
        .withMessage("username is invalid")
        .trim(),

    check("email")
        .isLength({ min: 1 })
        .withMessage("email is required")
        .isEmail()
        .withMessage("email is invalid")
        .custom(async value => {
            try {
                const email = await User.findOne({ email: value });
                if (email) throw ApiError("email is exists");
            } catch (err) {
                throw ApiError(err.message);
            }
        })
        .trim(),

    check("fullName")
        .isLength({ min: 1 })
        .withMessage("fullname is required")
        .isAlpha("en-US")
        .withMessage("fullname is is invalid")
        .trim(),

];

const addUserValidetionResult = (req, res, next) => {
    const error = validationResult(req);
    const mapedError = error.mapped();

    if (Object.keys(mapedError).length === 0) {
        next();
    } else {
        res.status(500).json({
            errors: mapedError
        });

    }
}

export { addUserValidetion, addUserValidetionResult };