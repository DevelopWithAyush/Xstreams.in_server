import { ErrorHandler, TryCatch } from "../../utility/utility.js";
import { Widget } from "../../model/widget.js";
import { v4 as uuidv4 } from "uuid";
import { validationResult } from "express-validator";

export const registerSite = TryCatch(async (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return next(new ErrorHandler(error.array()[0].msg, 400));
    }
    const { url } = req.body;
    const existingSite = await Widget.findOne({ url });

    if (existingSite) {
        return res.status(200).json({
            success: true,
            siteId: existingSite._id,
            message: "Site already registered",
        });
    }

    const siteId = uuidv4();


    const newSite = new Widget({
        userId: req.user._id,
        siteId,
        url
    });

    await newSite.save();

    res.status(201).json({
        success: true,
        siteId,
        message: 'Site registered successfully'
    });
});





