const PaymentSession=require('ssl-commerz-node').PaymentSession
const { CartItem}=require('../models/cartItem')
const { Profile } = require('../models/profile')


module.exports.ipn=async (req,res)=>{
  console.log(req.body)
}


module.exports.initPayment=async (req,res)=>{

    const userId=req.user._id
    const cartItems=await CartItem.find({user:userId})
    const profile=await Profile.findOne({user:userId})


    const {address1,address2,city,state,postcode,country,phone}=profile




    const total_amount=cartItems.map(item=>item.count*item.price).reduce((a,b)=>a+b,0)
    const total_item=cartItems.map(item=>item.count).reduce((a,b)=>a+b,0)
    const tran_id='_'+Math.random().toString(36).substr(2,9)+(new Date()).getTime();


    const payment=new PaymentSession(true,process.env.STORE_ID,process.env.STORE_PASSWORD)
    payment.setUrls({
        success: "yoursite.com/success", // If payment Succeed
        fail: "yoursite.com/fail", // If payment failed
        cancel: "yoursite.com/cancel", // If user cancel payment
        ipn: "https://ecomapi2.onrender.com/api/payment/ipn", // SSLCommerz will send http post request in this link
      });
      
      // Set order details
      payment.setOrderInfo({
        total_amount: total_amount, // Number field
        currency: "BDT", // Must be three character string
        tran_id: tran_id, // Unique Transaction id
        emi_option: 0, // 1 or 0
        multi_card_name: "internetbank", // Do not Use! If you do not customize the gateway list,
        allowed_bin: "371598,371599,376947,376948,376949", // Do not Use! If you do not control on transaction
        emi_max_inst_option: 3, // Max instalment Option
        emi_allow_only: 0, // Value is 1/0, if value is 1 then only EMI transaction is possible
      });
      
      // Set customer info
      payment.setCusInfo({
        name: req.user.name,
        email: req.user.email,
        add1: address1,
        add2: address2,
        city: city,
        state: state,
        postcode: postcode,
        country: country,
        phone: phone,
        fax: phone,
      });
      
      // Set shipping info
      payment.setShippingInfo({
        method: "Courier", //Shipping method of the order. Example: YES or NO or Courier
        num_item: total_item,
        name: req.user.name,
        add1: address1,
        add2: address2,
        city: city,
        state: state,
        postcode: postcode,
        country: country,
      });
      
      // Set Product Profile
      payment.setProductInfo({
        product_name: "ecom Products",
        product_category: "General",
        product_profile: "general",
      });

      response=await payment.paymentInit()
      return res.status(200).send(response)
}