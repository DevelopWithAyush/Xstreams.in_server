import mongoose,{Schema,Types} from "mongoose";

const paymentSchema = new Schema({
    userId: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ["ACTIVE","CANCELLED","SUSPENDED", "EXPIRED", "PENDING"],
        default: "ACTIVE",
    },
    subscriptionId: {
        type: String,
        required: true,
    },
 
}) 

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;