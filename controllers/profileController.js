const _=require('lodash')
const {Profile}=require('../models/profile')

module.exports.getProfile=async (req,res)=>{
    const profile =await Profile.findOne({user:req.user._id})
    return res.status(201).send(profile)

}

module.exports.setProfile=async (req,res)=>{

    let profile=await Profile.findOne({user:req.user._id})
    console.log(req.body)


    if (!profile){

        profile=new Profile(req.body)
        profile['user']=req.user._id
        await profile.save()
        return res.status(200).send("Profile Created")
    }
    else {
        const updatedFields=_.pick(req.body,['phone','address1','address2','city','state','postcode','country'])
        _.assignIn(profile,updatedFields)
        await profile.save()
        return res.status(201).send("Product Updated Successfilly")
    }

}