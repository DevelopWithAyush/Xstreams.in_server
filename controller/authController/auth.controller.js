import User from "../../model/user.js";
import { cookieOption } from "../../utility/features.js";
import { TryCatch } from "../../utility/utility.js";
import jwt from "jsonwebtoken";

export const handleGoogleAuth = TryCatch(async (req, res) => {
    const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const queryParams = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
    });

    const fullUrl = `${baseUrl}?${queryParams.toString()}`;

    res.redirect(fullUrl);
});

export const handleGoogleAuthCallback = TryCatch(async (req, res, next) => {

    const { code } = req.query;

    const response = await fetch(`https://oauth2.googleapis.com/token`, {
        method: "POST",
        body: JSON.stringify({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: "authorization_code"
        }),
    })

    const data = await response.json();



    const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo`, {
        headers: {
            Authorization: `Bearer ${data.access_token}`
        }
    })

    const userInfo = await userResponse.json();


    try {
        const existingUser = await User.findOne({ email: userInfo?.email });

        if (existingUser) {
            existingUser.name = userInfo.name || `${userInfo.given_name} ${userInfo.family_name}`;
            existingUser.profilePicture = userInfo.picture; 
            await existingUser.save();

            const token = jwt.sign({ _id: existingUser._id }, process.env.JWT_SECRET);
            return res.status(200)
                .cookie("token", token, cookieOption)
                .redirect(`${process.env.AUDIT_DASHBOARD_URL}`); 
        }

        const user = await User.create({
            name: userInfo.name || `${userInfo.given_name} ${userInfo.family_name}`,
            email: userInfo.email,
            profilePicture: userInfo.picture,
        });

        await user.save();

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
        return res.status(200)
            .cookie("token", token, cookieOption)
            .redirect(`${process.env.AUDIT_DASHBOARD_URL}`);
    } catch (error) {
        next(error);
    }

})


export const handleLogout = TryCatch(async (req, res) => {
    res.cookie("token","", { ...cookieOption, maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
})

export const handleGetUserDetails = TryCatch(async (req, res) => {
    const user = req.user;
    res.status(200).json({ user });
})