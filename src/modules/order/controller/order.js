import cartModel from "../../../../DB/model/Cart.model.js";
import couponModel from "../../../../DB/model/Coupon.model.js";
import orderModel from "../../../../DB/model/Order.model.js";
import productModel from "../../../../DB/model/Product.mode.js";
import sendEmail from "../../../utils/email.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import createInvoice from "../../../utils/pdf.js";
import { clearCartProducts, deleteElementsFromCart } from "../../cart/controller/cart.js";

import cloudinary from '../../../utils/cloudinary.js'
import fs from 'fs'

import path from 'path'
import { fileURLToPath } from 'url'
import { nanoid } from "nanoid";
//set directory dirname 
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const createOrder = asyncHandler(async (req, res, next) => {
    const { address, phone, note, couponName, paymentType } = req.body;

    if (!req.body.products) {
        const cart = await cartModel.findOne({ userId: req.user._id })
        if (!cart.products?.length) {
            return next(new Error(`empty cart`, { cause: 400 }))
        }
        req.body.isCart = true
        req.body.products = cart.products
    }


    if (couponName) {
        const coupon = await couponModel.findOne({ name: couponName.toLowerCase() })

        if (!coupon || coupon.expire.getTime() < Date.now()) {
            return next(new Error(`In-valid or expire coupon`, { cause: 400 }))
        }
        req.body.coupon = coupon;
    }

    const productsIds = []
    const finalProductsList = []
    let subtotal = 0;
    for (let product of req.body.products) {

        const checkProduct = await productModel.findOne({
            _id: product.productId,
            stock: { $gte: product.quantity },
            isDeleted: false
        })
        if (!checkProduct) {
            return next(new Error(`In-valid product ${product.productId}`, { cause: 400 }))
        }
        productsIds.push(product.productId)
        product = req.body.isCart ? product.toObject() : product
        product.name = checkProduct.name;
        product.unitPrice = checkProduct.finalPrice;
        product.finalPrice = product.unitPrice * product.quantity;
        finalProductsList.push(product)
        subtotal += product.finalPrice


    }

    const order = await orderModel.create({
        userId: req.user._id,
        address,
        note,
        phone,
        products: finalProductsList,
        couponId: req.body.coupon?._id,
        subtotal,
        finalPrice: subtotal - (subtotal * ((req.body.coupon?.amount || 0) / 100)),
        paymentType,
        status: paymentType == 'card' ? 'waitPayment' : 'placed'
    })

    for (const product of req.body.products) {
        await productModel.updateOne({ _id: product.productId }, { $inc: { stock: -parseInt(product.quantity) } })
    }

    if (req.body.coupon?._id) {
        await couponModel.updateOne({ _id: req.body.coupon?._id }, { $addToSet: { usedBy: req.user._id } })
    }

    if (!req.body.isCart) {
        await deleteElementsFromCart(productsIds, req.user._id)
    } else {
        await clearCartProducts(req.user._id)
    }

    // Generate Invoice
    // try {

    //     const invoice = {
    //         shipping: {
    //             name: req.user.userName,
    //             address: order.address,
    //             city: "Cairo",
    //             state: "Cairo",
    //             country: "Egypt",
    //             postal_code: 94111
    //         },
    //         items: order.products,
    //         subtotal: subtotal,
    //         paid: order.finalPrice,
    //         invoice_nr: order._id.toString(),
    //         discount: req.body.coupon?.amount || 0,
    //         createAt: order.createdAt
    //     };

    //     const customId = Date.now()
    //     await createInvoice(invoice, path.join(__dirname, `../PDF/invoice${customId}.pdf`));
    //     const { secure_url } = await cloudinary.uploader.upload(path.join(__dirname, `../PDF/invoice${customId}.pdf`), { folder: `${process.env.APP_NAME}/Invoice` })
    //     await sendEmail({
    //         to: req.user.email, subject: "Invoice", attachments: [{
    //             path: secure_url,
    //             contentType: 'application/pdf'
    //         }]
    //     })
    //     setTimeout(() => {
    //         try {
    //             fs.unlinkSync(path.join(__dirname, `../PDF/invoice${customId}.pdf`))
    //         } catch (error) {
    //             console.log(error);
    //         }
    //     }, 0)
    //     req.body.Invoice = true

    // } catch (error) {
    //     req.body.Invoice = false
    //     console.log(error);

    // }

    // Payment
    
    return res.status(201).json({ message: "Done", order, invoice: req.body.Invoice })
})


export const cancelOrder = asyncHandler(async (req, res, next) => {
    const { orderId } = req.params;
    const { reason } = req.body
    const order = await orderModel.findOne({ _id: orderId, userId: req.user._id })
    if (!order) {
        return next(new Error(`In-valid `, { cause: 400 }))
    }
    if ((order.status != 'placed' && order.paymentType == 'cash') ||
        (order.status != 'waitPayment' && order.paymentType == 'card')) {
        return next(new Error(`Cannot cancel your order  after it been changed to ${order.status} `, { cause: 400 }))
    }

    await orderModel.updateOne({ _id: orderId, userId: req.user._id }, { status: 'canceled', updatedBy: req.user._id, reason })
    for (const product of order.products) {
        await productModel.updateOne({ _id: product.productId }, { $inc: { stock: parseInt(product.quantity) } })
    }

    if (order.couponId) {
        await couponModel.updateOne({ _id: order.couponId }, { $pull: { usedBy: req.user._id } })
    }

    return res.status(201).json({ message: "Done", order })
})

export const deliveredOrder = asyncHandler(async (req, res, next) => {
    const { orderId } = req.params;
    const order = await orderModel.findOne({ _id: orderId })
    if (!order) {
        return next(new Error(`In-valid Id`, { cause: 400 }))
    }
    if (['waitPayment', 'canceled', 'rejected', 'delivered'].includes(order.status)) {
        return next(new Error(`Cannot update your order  after it been changed to ${order.status} `, { cause: 400 }))
    }

    await orderModel.updateOne({ _id: orderId }, { status: 'delivered', updatedBy: req.user._id })

    return res.status(201).json({ message: "Done", order })
})