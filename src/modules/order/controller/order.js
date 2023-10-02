import cartModel from "../../../../DB/model/Cart.model.js";
import couponModel from "../../../../DB/model/Coupon.model.js";
import orderModel from "../../../../DB/model/Order.model.js";
import productModel from "../../../../DB/model/Product.model.js";
import sendEmail from "../../../utils/email.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import {
  clearCartProducts,
  deleteElementsFromCart,
} from "../../cart/controller/cart.js";

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

  return res.status(201).json({ success: true, message: "done", order });
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
