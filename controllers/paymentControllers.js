const PaymentSession = require('ssl-commerz-node').PaymentSession;
const { CartItem } = require('../models/cartItem');
const { Profile } = require('../models/profile');
const { Order } = require('../models/Order');
const { Payment } = require('../models/payment');
const { v4: uuidv4 } = require('uuid'); // Consider using UUID

module.exports.ipn = async (req, res) => {
    try {
        const payment = new Payment(req.body);
        const tran_id = payment['tran_id'];

        if (payment['status'] === 'VALID') {
            const order = await Order.findOne({ transaction_id: tran_id });

            if (order) {
                await Order.updateOne({ transaction_id: tran_id }, { status: 'Complete' });
                await CartItem.deleteMany({ _id: { $in: order.cartItems } });
            } else {
                console.error(`Order with transaction_id ${tran_id} not found`);
            }
        } else {
            await Order.deleteOne({ transaction_id: tran_id });
        }

        await payment.save();
        res.status(200).send("IPN Received");
    } catch (error) {
        console.error('IPN Error:', error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports.initPayment = async (req, res) => {
    try {
        const userId = req.user._id;
        const cartItems = await CartItem.find({ user: userId });
        const profile = await Profile.findOne({ user: userId });

        if (!profile) {
            return res.status(404).send("Profile not found");
        }

        const { address1, address2, city, state, postcode, country, phone } = profile;

        const total_amount = cartItems.reduce((total, item) => total + (item.count * item.price), 0);
        const total_item = cartItems.reduce((total, item) => total + item.count, 0);
        const tran_id = uuidv4(); // Use UUID for unique transaction IDs

        const payment = new PaymentSession(true, process.env.STORE_ID, process.env.STORE_PASSWORD);
        payment.setUrls({
            success: `${process.env.BASE_URL}/success`, // Ensure BASE_URL is set correctly
            fail: `${process.env.BASE_URL}/fail`,
            cancel: `${process.env.BASE_URL}/cancel`,
            ipn: `${process.env.BASE_URL}/api/payment/ipn`,
        });

        payment.setOrderInfo({
            total_amount: total_amount,
            currency: "BDT",
            tran_id: tran_id,
            emi_option: 0,
        });

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

        payment.setShippingInfo({
            method: "Courier",
            num_item: total_item,
            name: req.user.name,
            add1: address1,
            add2: address2,
            city: city,
            state: state,
            postcode: postcode,
            country: country,
        });

        payment.setProductInfo({
            product_name: "ecom Products",
            product_category: "General",
            product_profile: "general",
        });

        const response = await payment.paymentInit();
        const order = new Order({ cartItems: cartItems, user: userId, transaction_id: tran_id, address: profile });

        if (response.status === 'SUCCESS') {
            order.sessionKey = response['sessionkey'];
            await order.save();
        }

        res.status(200).send(response);
    } catch (error) {
        console.error('Payment Initialization Error:', error);
        res.status(500).send("Internal Server Error");
    }
};
