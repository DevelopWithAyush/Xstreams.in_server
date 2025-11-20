import mongoose,{Schema,Types} from "mongoose";

const planSchema = new Schema({
    name:{
        type:String,
        required:true,
    },
    price:{
        type:Number,
        required:true,
    },
    features: [
        {
            type:String,
            required:true,
        }
    ],
    discountedPrice: {
        type:Number,
        required:true,
    },

}, {
    timestamps: true,
})

const Plan = mongoose.model("Plan", planSchema);

export default Plan;