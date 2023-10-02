import cartModel from "../../../../DB/model/Cart.model.js";
import couponModel from "../../../../DB/model/Coupon.model.js";
import orderModel from "../../../../DB/model/Order.model.js";
import productModel from "../../../../DB/model/Product.model.js";
import sendEmail from "../../../utils/email.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import createInvoice from "../../../utils/pdf.js";
import {
  clearCartProducts,
  deleteElementsFromCart,
} from "../../cart/controller/cart.js";
import payment from "../../../utils/payment.js";
import cloudinary from "../../../utils/cloudinary.js";
import fs from "fs";

import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

//set directory dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const getAllOrders = asyncHandler(async (req, res, next) => {
  const orders = await orderModel.find().populate([
    { path: "userId", select: "userName email gender" },
    { path: "coupon", select: "-usedBy -firstOrder" },
  ]);
  if (!orders) {
    return next(new Error(`Orders Not Found`, { cause: 404 }));
  }
  return res.status(200).json({ success: true, message: "done", orders });
});

export const createOrder = asyncHandler(async (req, res, next) => {
  const { address, phone, note, couponName, paymentType } = req.body;

  if (!req.body.products) {
    const cart = await cartModel.findOne({ userId: req.user._id });
    if (!cart.products?.length) {
      return next(new Error("Empty cart", { cause: 400 }));
    }
    req.body.isCart = true;
    req.body.products = cart.products;
  }

  const productsIds = [];
  const finalProductsList = [];
  let subtotal = 0;
  for (let product of req.body.products) {
    const checkProduct = await productModel.findOne({
      _id: product.productId,
      stock: { $gte: product.quantity },
      isDeleted: false,
    });
    if (!checkProduct) {
      return next(
        new Error(`Invalid product ${product.productId}`, { cause: 400 })
      );
    }
    productsIds.push(product.productId);
    product = req.body.isCart ? product.toObject() : product;
    product.name = checkProduct.name;
    product.slug = checkProduct.slug;
    product.unitPrice = checkProduct.finalPrice;
    product.finalPrice = product.unitPrice * product.quantity;
    finalProductsList.push(product);
    subtotal += product.finalPrice;
  }

  if (couponName) {
    const coupon = await couponModel.findOne({
      code: couponName.toUpperCase(),
    });

    if (!coupon || coupon.expire.getTime() < Date.now()) {
      return next(new Error("Invalid or expired coupon", { cause: 400 }));
    }

    if (coupon.minOrderAmount > subtotal) {
      return next(
        new Error(
          `Minimum order amount must be ${coupon.minOrderAmount} EGP to use the coupon`,
          { cause: 400 }
        )
      );
    }

    req.body.coupon = coupon;
  }

  const order = await orderModel.create({
    userId: req.user._id,
    address,
    note,
    phone,
    products: finalProductsList,
    coupon: req.body.coupon?._id,
    subtotal,
    finalPrice: subtotal - (req.body.coupon?.amount || 0),
    paymentType,
    status: paymentType == "card" ? "waitPayment" : "placed",
  });

  for (const product of req.body.products) {
    await productModel.updateOne(
      { _id: product.productId },
      { $inc: { stock: -parseInt(product.quantity) } }
    );
  }

  if (req.body.coupon?._id) {
    await couponModel.updateOne(
      { _id: req.body.coupon?._id },
      { $addToSet: { usedBy: req.user._id } }
    );
  }

  if (!req.body.isCart) {
    await deleteElementsFromCart(productsIds, req.user._id);
  } else {
    await clearCartProducts(req.user._id);
  }

  // Generate Invoice

  try {
    const invoice = {
      shipping: {
        email: req.user.email,
        name: req.user.userNname,
        address: order.address,
        city: "Cairo",
        state: "Cairo",
        country: "Egypt",
        postal_code: 94111,
      },
      items: order.products,
      subtotal: subtotal,
      paid: order.finalPrice,
      invoice_nr: order._id.toString(),
      discount: req.body.coupon?.amount || 0,
      createAt: order.createdAt,
    };

    const customId = Date.now();
    await createInvoice(
      invoice,
      path.join(__dirname, `../PDF/invoice${customId}.pdf`)
    );
    const { secure_url } = await cloudinary.uploader.upload(
      path.join(__dirname, `../PDF/invoice${customId}.pdf`),
      { folder: `${process.env.APP_NAME}/Invoice` }
    );
    await sendEmail({
      to: req.user.email,
      subject: "Invoice",
      attachments: [
        {
          path: secure_url,
          contentType: "application/pdf",
        },
      ],
    });
    setTimeout(() => {
      try {
        fs.unlinkSync(path.join(__dirname, `../PDF/invoice${customId}.pdf`));
      } catch (error) {
        console.log(error);
      }
    }, 0);
    req.body.Invoice = true;
  } catch (error) {
    req.body.Invoice = false;
  }

  // Payment

  if (order.paymentType == "card") {
    const session = await payment({
      customer_email: req.user.email,
      metadata: {
        orderId: order._id.toString(),
      },
      cancel_url: `${req.protocol}://${
        req.headers.host
      }/order/cancel?orderId=${order._id.toString()}`,
      line_items: order.products.map((product) => {
        return {
          price_data: {
            currency: "egp",
            product_data: {
              name: product.name,
            },
            unit_amount: product.unitPrice * 100,
          },
          quantity: product.quantity,
        };
      }),
    });
    return res
      .status(201)
      .json({ success: true, message: "done", order, session });
  }

  return res
    .status(201)
    .json({ success: true, message: "done", order, invoice: req.body.Invoice });
});

export const webHook = asyncHandler(async (req, res, next) => {
  const stripe = require("stripe")(process.env.Secret_key);

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.endpointSecret
    );
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  const { orderId } = event.data.object.metadata;
  if (event.type != "checkout.session.completed") {
    await orderModel.updateOne({ _id: orderId }, { status: "rejected" });
    return res.status(400).json({ message: "Rejected payment" });
  }
  await orderModel.updateOne({ _id: orderId }, { status: "placed" });
  return res.status(200).json({ success: true, message: "done" });
});

export const cancelOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const order = await orderModel.findOne({
    _id: orderId,
    userId: req.user._id,
  });
  if (!order) {
    return next(new Error(`In-valid `, { cause: 400 }));
  }
  if (
    (order.status != "placed" && order.paymentType == "cash") ||
    (order.status != "waitPayment" && order.paymentType == "card")
  ) {
    return next(
      new Error(
        `Cannot cancel your order after it been changed to ${order.status} `,
        { cause: 400 }
      )
    );
  }

  await orderModel.updateOne(
    { _id: orderId, userId: req.user._id },
    { status: "canceled", updatedBy: req.user._id, reason }
  );
  for (const product of order.products) {
    await productModel.updateOne(
      { _id: product.productId },
      { $inc: { stock: parseInt(product.quantity) } }
    );
  }

  if (order.couponId) {
    await couponModel.updateOne(
      { _id: order.couponId },
      { $pull: { usedBy: req.user._id } }
    );
  }

  return res.status(201).json({ success: true, message: "done", order });
});

export const deliveredOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const order = await orderModel.findOne({ _id: orderId });
  if (!order) {
    return next(new Error(`In-valid Id`, { cause: 400 }));
  }
  if (
    ["waitPayment", "canceled", "rejected", "delivered"].includes(order.status)
  ) {
    return next(
      new Error(`Order status is ${order.status}, Cannot be changed `, {
        cause: 400,
      })
    );
  }

  await orderModel.updateOne(
    { _id: orderId },
    { status: "delivered", updatedBy: req.user._id }
  );

  return res.status(201).json({ success: true, message: "done", order });
});
