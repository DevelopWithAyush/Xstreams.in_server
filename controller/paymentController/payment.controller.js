import { TryCatch } from "../../utility/utility.js";
import User from "../../model/user.js";
import Payment from "../../model/payment.js";

export const handleSubscriptionSuccess = TryCatch(async (req, res) => { 
    const { subscriptionId } = req.body; 
    if (!subscriptionId) {
        return res.status(400).json({ message: "Subscription ID is required" });
    } 
    console.log(subscriptionId);


    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }  

    console.log(user)

    const existingPayment = await Payment.findOne({
        userId: user._id,
        status: "ACTIVE",
    })

    if (existingPayment) {
        return res.status(400).json({ message: "User already has an active subscription" });
    } 

    const newPayment = await Payment.create({
        userId: user._id,
        subscriptionId,
        status: "ACTIVE",
    }) 

    user.subscription = "LITE";
    user.subscriptionStartDate = new Date();
    user.auditCredit = "UNLIMITED";
    user.subscriptionEndDate = new Date(new Date().setMonth(new Date().getMonth() + 1));
    await user.save();

    res.status(200).json({ success: true, message: "Subscription created successfully" });
})