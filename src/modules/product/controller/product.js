import subcategoryModel from "../../../../DB/model/Subcategory.model.js";
import brandModel from "../../../../DB/model/Brand.model.js";
import productModel from "../../../../DB/model/Product.model.js";

import slugify from "slugify";
import cloudinary from "../../../utils/cloudinary.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { nanoid } from "nanoid";
import userModel from "../../../../DB/model/User.model.js";
import { paginate } from "../../../utils/paginate.js";
import categoryModel from "../../../../DB/model/Category.model.js";

export const products = asyncHandler(async (req, res, next) => {
  let { size, page, searchKey, categoryId, ...filterQuery } = req.query;

  const mongooseQuery = productModel.find().populate([
    { path: "review", populate: { path: "createdBy", select: "userName" } },
    { path: "categoryId", select: "name" },
    { path: "subcategoryId", select: "name" },
    { path: "brandId", select: "name" },
    { path: "createdBy", select: "userName" },
    { path: "updatedBy", select: "userName" },
    { path: "wishUser", select: "userName" },
  ]);

  const { skip, limit } = paginate(page, size);
  mongooseQuery.skip(skip).limit(limit);

  if (req.query.searchKey) {
    filterQuery = {
      ...filterQuery,
      $or: [{ name: { $regex: searchKey, $options: "i" } }],
    };
  }

  if (categoryId) {
    const categoryData = await categoryModel.findOne({ _id: categoryId });

    if (categoryData) {
      filterQuery.categoryId = categoryData._id; // Use the category's unique identifier
    } else {
      return res.status(404).json({ message: "Category not found" });
    }
  }

  mongooseQuery.find(filterQuery);

  if (req.query.fields) {
    const fields = req.query.fields.replace(/,/g, " ");
    mongooseQuery.select(fields);
  }
  if (req.query.sort) {
    const sort = req.query.sort.replace(/,/g, " ");
    mongooseQuery.sort(sort);
  }

  const products = await mongooseQuery;
  const productsCount = await productModel.countDocuments(filterQuery);

  return res.status(200).json({ products, limit, page, productsCount });
});

export const productDetails = asyncHandler(async (req, res, next) => {
  const { productSlug } = req.params;
  const product = await productModel.findOne({ slug: productSlug }).populate([
    { path: "review", populate: { path: "createdBy", select: "userName" } },
    { path: "categoryId", select: "name slug" },
    { path: "subcategoryId", select: "name slug" },
    { path: "brandId", select: "name slug" },
    { path: "createdBy", select: "userName" },
    { path: "updatedBy", select: "userName" },
    { path: "wishUser", select: "userName" },
  ]);
  if (!product) {
    new Error("Product not found", { cause: 404 });
  }
  return res.status(200).json({ product });
});

//500 -50& => 500*25/100 == 500 - 125 = 375
export const createProduct = asyncHandler(async (req, res, next) => {
  const { name, price, discount, categoryId, subcategoryId, brandId } =
    req.body;
  //check  ids
  if (!(await subcategoryModel.findOne({ _id: subcategoryId, categoryId }))) {
    return next(
      new Error("In-valid category or subcategory ids", { cause: 400 })
    );
  }
  if (!(await brandModel.findById(brandId))) {
    return next(new Error("In-valid brand id", { cause: 400 }));
  }
  if (await productModel.findOne({ name })) {
    return next(new Error("Product name already exists", { cause: 400 }));
  }
  //create slug
  req.body.slug = slugify(name, {
    replacement: "-",
    trim: true,
    lower: true,
  });

  //calc final price
  const overprice = 0; //10%
  const discountedPrice = price - (price * (discount || 0)) / 100;
  req.body.finalPrice =
    discountedPrice + (discountedPrice * (overprice || 0)) / 100;

  req.body.customId = nanoid();
  // handel image
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.files?.mainImage[0].path,
    { folder: `${process.env.APP_NAME}/product/${req.body.customId}` }
  );
  req.body.mainImage = { secure_url, public_id };

  if (req.files?.subImages?.length) {
    req.body.subImages = [];
    for (const file of req.files.subImages) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: `${process.env.APP_NAME}/product/${req.body.customId}/subImages`,
        }
      );
      req.body.subImages.push({ secure_url, public_id });
    }
  }

  const size = req.body.size ? JSON.parse(req.body.size) : [];
  const colors = req.body.colors ? JSON.parse(req.body.colors) : [];
  const attributes = req.body.attributes ? JSON.parse(req.body.attributes) : [];
  req.body.attributes = attributes;
  req.body.size = size;
  req.body.colors = colors;
  req.body.createdBy = req.user._id;
  req.body.overprice = overprice;

  const product = await productModel.create(req.body);

  return res.status(201).json({
    success: true,
    message: "Product Added Successfully",
  });
});

export const updateProduct = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const product = await productModel.findById(productId);
  if (!product) {
    return next(new Error("In-valid product id", { cause: 404 }));
  }

  const { name, price, discount, categoryId, subcategoryId, brandId } =
    req.body;
  //check  ids
  if (categoryId && subcategoryId) {
    if (!(await subcategoryModel.findOne({ _id: subcategoryId, categoryId }))) {
      return next(
        new Error("In-valid category or subcategory ids", { cause: 400 })
      );
    }
  }
  if (brandId) {
    if (!(await brandModel.findById(brandId))) {
      return next(
        new Error("In-valid category or subcategory ids", { cause: 400 })
      );
    }
  }

  if (name) {
    //create slug
    req.body.slug = slugify(name, {
      replacement: "-",
      trim: true,
      lower: true,
    });
  }

  //calc final  price
  req.body.finalPrice =
    price || discount
      ? (price || product.price) -
        (price || product.price) * ((discount || product.discount) / 100)
      : product.finalPrice;
  // if (price && discount) {
  //     req.body.finalPrice = price - (price * (discount / 100))   // (100-discount)/100 * price
  // } else if (price) {
  //     req.body.finalPrice = price - (price * (product.discount / 100))   // (100-discount)/100 * price
  // } else if (discount) {
  //     req.body.finalPrice = product.price - (product.price * (discount / 100))   // (100-discount)/100 * price
  // }

  // handel image
  if (req.files?.mainImage?.length) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.files?.mainImage[0].path,
      { folder: `${process.env.APP_NAME}/product/${product.customId}` }
    );
    req.body.mainImage = { secure_url, public_id };
    await cloudinary.uploader.destroy(product.mainImage.public_id);
  }

  if (req.files?.subImages?.length) {
    req.body.subImages = [];
    for (const file of req.files.subImages) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: `${process.env.APP_NAME}/product/${product.customId}/subImages`,
        }
      );
      req.body.subImages.push({ secure_url, public_id });
    }
    // if (product.subImages?.length) {
    //   cloudinary.api.delete_All_resources([''])
    // }
  }
  req.body.updatedBy = req.user._id;
  await productModel.updateOne({ _id: productId }, req.body);
  return res.status(200).json({ success: true, message: "done" });
});

export const wishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  if (!(await productModel.findOne({ _id: productId, isDeleted: false }))) {
    return next(new Error("In-valid product", { cause: 404 }));
  }
  await userModel.updateOne(
    { _id: req.user._id },
    { $addToSet: { wishlist: productId } }
  );

  return res.status(200).json({ success: true, message: "done" });
});

export const deleteFromWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  await userModel.updateOne(
    { _id: req.user._id },
    { $pull: { wishlist: productId } }
  );
  return res.status(200).json({ success: true, message: "done" });
});
