const _=require('lodash')
const{CartItem,CartItemSchema}=require('../models/cartItem')


module.exports.createCartItem=async (req,res)=>{
    let {price,product,count}=_.pick(req.body,['price','product','count'])
    const item=await CartItem.findOne({
        user:req.user._id,
        product:product
    })
    if (item) return res.status(400).send("item Already Exist in cart")
        let cartItem=new CartItem({price:price,product:product,count:count,user:req.user._id})
   const result= await cartItem.save()
    return res.status(201).send({
        message:"Added to curt successfully",
        data:result
    })

}

module.exports.getCartItem=async (req,res)=>{
    const cartItems=await CartItem.find({
        user:req.user._id
    })
    .populate('product','name')
    .populate('user','name')

    return res.status(200).send(cartItems)

}

module.exports.updateCartItem=async (req,res)=>{
    const {_id,count}=_.pick(req.body,['count','_id'])
    userId=req.user._id
    await CartItem.updateOne({_id:_id,user:userId},{count:count})
    console.log(_id,count)
    return res.status(200).send("Item updated Successfully!!")
}

module.exports.deleteCartItem=async (req,res)=>{
    const _id=req.params.id;
    userId=req.user._id;
    await CartItem.deleteOne({_id:_id,user:userId})
    return res.status(200).send("Deleted!!");
}