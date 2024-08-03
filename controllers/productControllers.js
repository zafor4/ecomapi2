const _ = require('lodash');
const formidable = require('formidable');
const fs = require('fs');
const { Product, validate } = require('../models/product');

module.exports.createProduct = async (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(400).send("Something went wrong!");

        const { error } = validate(_.pick(fields, ["name", "description", "price", "category", "quantity"]));
        if (error) return res.status(400).send(error.details[0].message);

        const product = new Product(fields);

        if (files.photo) {
            try {
                const data = await fs.promises.readFile(files.photo.path);
                product.photo.data = data;
                product.photo.contentType = files.photo.type;

                const result = await product.save();
                return res.status(201).send({
                    message: "Product Created Successfully!",
                    data: _.pick(result, ["name", "description", "price", "category", "quantity"]),
                });
            } catch (error) {
                return res.status(500).send("Internal Server Error!");
            }
        } else {
            return res.status(400).send("No image provided!");
        }
    });
};

// Query Parameter
// api/product?order=desc&sortBy=name&limit=10
module.exports.getProducts = async (req, res) => {
    let order = req.query.order === 'desc' ? -1 : 1;
    let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
    let limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const products = await Product.find()
        .select({ photo: 0 })
        .sort({ [sortBy]: order })
        .limit(limit)
        .populate('category', 'name');
    return res.status(200).send(products);

}

module.exports.getProductById = async (req, res) => {
    const productId=req.params.id;
    const product=await Product.findById(productId)
    .select({photo:0})
    .populate('category','name')
    if (!product) res.status(404).send("Not Found")
        return res.status(200).send(product)
        
    

}

module.exports.getPhoto=async (req,res)=>{
    const productId=req.params.id
    const product=await Product.findById(productId)
    console.log(product.photo.data)
    res.set('Content-Type',product.photo.contentType)
    return res.status(200).send(product.photo.data)
}

module.exports.updateProductById = async (req, res) => {

    const productId=req.params.id;

    const product=await Product.findById(productId)
    let form =new formidable.IncomingForm();
    form.keepExtensions=true
    form.parse(req,async (err,fields,files)=>{
        if(err) return res.status(400).send("Something wrong!!")
            const updatedFields=_.pick(fields,["name","description","price","category","quantity"])
        _.assignIn(product,updatedFields)
        if (files.photo) {
            try {
                const data = await fs.promises.readFile(files.photo.path);
                product.photo.data = data;
                product.photo.contentType = files.photo.type;

                const result = await product.save();
                return res.status(201).send({
                    message: "Product updated Successfully!",
                    data: _.pick(result, ["name", "description", "price", "category", "quantity"]),
                });
            } catch (error) {
                return res.status(500).send("Internal Server Error!");
            }
        } else {
            const result = await product.save();
            return res.status(201).send({
                message: "Product updated Successfully!",
                data: _.pick(result, ["name", "description", "price", "category", "quantity"]),
            });
        }
    })

}

const body={
    order:'desc',
    sortBy:'price',
    limit:6,
    skip:20,

    filters:{
        price:[1000,2000],
        category:['']
    }

}

module.exports.filterProducts=async (req,res)=>{
    let order=req.body.order==='desc'?-1:1;
    let sortBy=req.body.sortBy?req.body.sortBy:'_id'
    let limit=req.body.limit?parseInt(req.body.limit):10;
    let skip=parseInt(req.body.skip)
    let filters=req.body.filters;

    let args={}

    for (let key in filters){
        if (filters[key].length>0){
            if (key==='price'){
                args['price']={
                    $gte:filters['price'][0],
                    $lte:filters['price'][1]
                }
            }
            console.log(args)
            if (key==='category'){
                args['category']={
                    $in:filters['category']
                }
                console.log(args)

            }
        }
    }


    const product=await Product.find(args)
    .select({photo:0})
    .populate('category','name')
    .sort({[sortBy]:order})
    .skip(skip)
    .limit(limit)

    return res.status(200).send(product);

}



