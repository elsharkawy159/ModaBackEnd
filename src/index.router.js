import authRouter from "./modules/auth/auth.router.js";
import vendorRouter from "./modules/vendor/vendor.router.js";
import branRouter from "./modules/brand/brand.router.js";
import cartRouter from "./modules/cart/cart.router.js";
import categoryRouter from "./modules/category/category.router.js";
import couponRouter from "./modules/coupon/coupon.router.js";
import orderRouter from "./modules/order/order.router.js";
import productRouter from "./modules/product/product.router.js";
import reviewsRouter from "./modules/reviews/reviews.router.js";
import subcategoryRouter from "./modules/subcategory/subcategory.router.js";
import connectDB from "../DB/connection.js";
import { globalErrorHandling } from "./utils/errorHandling.js";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
const initApp = (app, express) => {
  connectDB();
  app.use(cors(), express.json());
  app.use(compression());
  //convert Buffer Data
  if (process.env.MOOD == "DEV") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("common"));
  }

  //Setup API Routing
  app.use(`/auth`, authRouter);
  app.use(`/vendor`, vendorRouter);
  app.use(`/product`, productRouter);
  app.use(`/category`, categoryRouter);
  app.use(`/subCategory`, subcategoryRouter);
  app.use(`/reviews`, reviewsRouter);
  app.use(`/coupon`, couponRouter);
  app.use(`/cart`, cartRouter);
  app.use(`/order`, orderRouter);
  app.use(`/brand`, branRouter);

  app.use("*", (req, res, next) => {
    res.send(
      `${process.env.APP_NAME} | In-valid Routing, Please check URL or Method`
    );
  });
  app.use(globalErrorHandling);
};

export default initApp;
