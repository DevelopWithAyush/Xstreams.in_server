import { validationResult } from "express-validator";
import nodemailer from "nodemailer";

export const createCTA = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, number } = req.body;
    console.log(email, number);
    // setup nodemailer to send this on email  
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
        }
    })
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: "info@axto.ai",
        subject: "New CTA Submission",
        html: `
            <h2>New CTA Form Submission</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone Number:</strong> ${number}</p>
        `
    }   
    await transporter.sendMail(mailOptions);
    res.status(200).json({success: true, message: "CTA created successfully" });
}