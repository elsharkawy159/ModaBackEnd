import cartModel from "../../../../DB/model/Cart.model.js";
import productModel from "../../../../DB/model/Product.model.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

export const getUserCart = asyncHandler(async (req, res, next) => {
  const cart = await cartModel
    .findOne({ userId: req.user._id })
    .populate("products.productId");

  if (!cart) {
    return next(new Error("Cart not found", { cause: 404 }));
  }

  //   const populatedCart = await cart
  //     .populate("products.productId")
  //     .execPopulate();

  return res.status(200).json({ cart });
});

export const addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;
  const product = await productModel.findOne({
    _id: productId,
    stock: { $gte: quantity },
    isDeleted: false,
  });
  if (!product) {
    return next(
      new Error(`In-valid product max available stock is :${product?.stock}`, {
        cause: 400,
      })
    );
  }

  const cart = await cartModel.findOne({ userId: req.user._id });
  if (!cart) {
    const newCart = await cartModel.create({
      userId: req.user._id,
      products: [{ productId, quantity }],
    });

    return res
      .status(201)
      .json({ success: true, message: "done", cart: newCart });
  }

  let matchProduct = false;
  for (const product of cart.products) {
    if (product.productId.toString() == productId) {
      product.quantity = quantity;
      matchProduct = true;
      break;
    }
  }

  if (!matchProduct) {
    cart.products.push({ productId, quantity });
  }

  await cart.save();
  return res.status(200).json({ success: true, message: "done", cart });
});

export async function deleteElementsFromCart(productIds, userId) {
  const cart = await cartModel.updateOne(
    { userId },
    {
      $pull: {
        products: {
          productId: { $in: productIds },
        },
      },
    }
  );
  return cart;
}

export const deleteFromCart = asyncHandler(async (req, res, next) => {
  const cart = await deleteElementsFromCart(req.body.productIds, req.user._id);
  return res.status(200).json({ success: true, message: "done", cart });
});

export async function clearCartProducts(userId) {
  const cart = await cartModel.updateOne({ userId }, { products: [] });
  return cart;
}

export const clearCart = asyncHandler(async (req, res, next) => {
  const cart = await clearCartProducts(req.user._id);
  return res.status(200).json({ success: true, message: "done", cart });
});
