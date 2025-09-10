const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
    code:{type:String,  required:true},
    offerType:{type:String,enum:['percentage','flat'], required:true},
    value:{type:Number,required:true},
    description:{type:String},
    startDate:{type:Date},
    endDate:{type:Date},
    lastUsedAmount: {
    type: Number,
    default: 0,
  },
    // eligibleProducts: [
    //   {
    //     type: String,
    //     ref: "Product", // Reference to Product model
    //     required: true
    //   }
    // ],
    active:{type:Boolean,default:true}
})

module.exports = mongoose.model('Offer',offerSchema);
