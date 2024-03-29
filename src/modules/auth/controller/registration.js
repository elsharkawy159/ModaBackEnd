import userModel from "../../../../DB/model/User.model.js";
import sendEmail from "../../../utils/email.js";
import { hash, compare } from "../../../utils/HashAndCompare.js";
import {
  generateToken,
  verifyToken,
} from "../../../utils/GenerateAndVerifyToken.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { customAlphabet } from "nanoid";
import { paginate } from "../../../utils/paginate.js";
import vendorModel from "../../../../DB/model/Vendor.model.js";

export const getUsers = asyncHandler(async (req, res) => {
  let { size, page, ...filterQuery } = req.query;
  const { skip, limit } = paginate(page, size);

  const mongooseQuery = userModel.find(filterQuery);

  mongooseQuery.skip(skip).limit(limit);

  if (req.query.fields) {
    const fields = req.query.fields.replace(/,/g, " ");
    mongooseQuery.select(fields);
  }
  if (req.query.sort) {
    const sort = req.query.sort.replace(/,/g, " ");
    mongooseQuery.sort(sort);
  }

  const users = await mongooseQuery;
  const usersCount = await userModel.countDocuments(filterQuery);

  return res.status(200).json({ users, limit, page, usersCount });
});

export const signup = asyncHandler(async (req, res, next) => {
  const { userName, email, password, phone, gender } = req.body;
  //check email exist
  if (await userModel.findOne({ email: email.toLowerCase() })) {
    return next(new Error("Email address exists", { cause: 409 }));
  }
  if (await userModel.findOne({ userName: userName.toLowerCase() })) {
    return next(new Error("User Name exists", { cause: 409 }));
  }
  if (await userModel.findOne({ phone })) {
    return next(new Error("phone exists", { cause: 409 }));
  }
  //send email
  const token = generateToken({
    payload: { email },
    signature: process.env.EMAIL_TOKEN,
    expiresIn: 60 * 10,
  });
  const refreshToken = generateToken({
    payload: { email },
    signature: process.env.EMAIL_TOKEN,
    expiresIn: 60 * 60 * 24,
  });

  const link = `${req.protocol}://${req.headers.host}/auth/confirmEmail/${token}`;
  const rfLink = `${req.protocol}://${req.headers.host}/auth/NewConfirmEmail/${refreshToken}`;

  const html = `<!DOCTYPE html>
    <html>
    <head>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"></head>
    <style type="text/css">
    body{background-color: #88BDBF;margin: 0px;}
    </style>
    <body style="margin:0px;"> 
    <table border="0" width="50%" style="margin:auto;padding:30px;background-color: #F3F3F3;border:1px solid #630E2B;">
    <tr>
    <td>
    <table border="0" width="100%">
    <tr>
    <td>
    <h1>
        <img width="100px" src="https://res.cloudinary.com/ddajommsw/image/upload/v1670702280/Group_35052_icaysu.png"/>
    </h1>
    </td>
    <td>
    <p style="text-align: right;"><a href="http://localhost:4200/#/" target="_blank" style="text-decoration: none;">View In Website</a></p>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    <tr>
    <td>
    <table border="0" cellpadding="0" cellspacing="0" style="text-align:center;width:100%;background-color: #fff;">
    <tr>
    <td style="background-color:#630E2B;height:100px;font-size:50px;color:#fff;">
    <img width="50px" height="50px" src="${process.env.logo}">
    </td>
    </tr>
    <tr>
    <td>
    <h1 style="padding-top:25px; color:#630E2B">Email Confirmation</h1>
    </td>
    </tr>
    <tr>
    <td>
    <p style="padding:0px 100px;">
    </p>
    </td>
    </tr>
    <tr>
    <td>
    <a href="${link}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">Verify Email address</a>
    </td>
    </tr>
    <tr>
    <td>
    <br>
    <br>
    <br>
    <br>
    <br>
    <br>
    <br>
    <br>
    <a href="${rfLink}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">Request new  esmail </a>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    <tr>
    <td>
    <table border="0" width="100%" style="border-radius: 5px;text-align: center;">
    <tr>
    <td>
    <h3 style="margin-top:10px; color:#000">Stay in touch</h3>
    </td>
    </tr>
    <tr>
    <td>
    <div style="margin-top:20px;">

    <a href="${process.env.facebookLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35062_erj5dx.png" width="50px" hight="50px"></span></a>
    
    <a href="${process.env.instegram}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35063_zottpo.png" width="50px" hight="50px"></span>
    </a>
    
    <a href="${process.env.twitterLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group_35064_i8qtfd.png" width="50px" hight="50px"></span>
    </a>

    </div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </body>
    </html>`;

  if (!(await sendEmail({ to: email, subject: "Confirmation-Email", html }))) {
    return res.status(400).json({ message: "Email Rejected" });
  }
  //hashPassword
  const hashPassword = hash({ plaintext: password });
  //save
  const { _id } = await userModel.create({
    userName,
    email,
    password: hashPassword,
    phone,
    gender,
  });
  return res.status(201).json({
    success: true,
    message: "Account created successfully, please confirm your email",
  });
});

export const updateUser = asyncHandler(async (req, res, next) => {
  const { userName, phone } = req.body;

  const existingUser = await userModel.findOne({
    userName: userName.toLowerCase(),
  });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "User Name already exists",
    });
  }

  const existingPhone = await userModel.findOne({ phone });
  if (existingPhone) {
    return res.status(409).json({
      success: false,
      message: "Phone number already exists",
    });
  }
  const user = await userModel.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
  });

  return res.status(201).json({
    success: true,
    message: "Updated successfully",
    user,
  });
});

export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { email } = verifyToken({ token, signature: process.env.EMAIL_TOKEN });
  if (!email) {
    return next(new Error("In-valid token payload", { cause: 400 }));
  }

  const result = await userModel.updateOne(
    { email: email.toLowerCase() },
    { confirmEmail: true }
  );

  if (result.nModified === 0) {
    return res.status(400).send(`<p>Not registered account.</p>`);
  } else {
    return res.status(200).redirect(`${process.env.FE_URL}/login`);
  }
});

export const RequestNewConfirmEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { email } = verifyToken({ token, signature: process.env.EMAIL_TOKEN });
  if (!email) {
    return next(new Error("In-valid token payload", { cause: 400 }));
  }
  const user = await userModel.findOne({ email: email.toLowerCase() });

  if (!user) {
    // return res.status(404).redirect(`${process.env.FE_URL}/#/invalidEmail`)
    // return res.status(404).render(`invalidEmail`, { message: "Not register account" })//EJS template
    return res.status(404).send(`<p>Not register account.</p>`);
  }
  if (user.confirmEmail) {
    return res.status(404).redirect(`${process.env.FE_URL}/#/login`);
  }
  const newToken = generateToken({
    payload: { email },
    signature: process.env.EMAIL_TOKEN,
    expiresIn: 60 * 2,
  });
  const link = `${req.protocol}://${req.headers.host}/auth/confirmEmail/${newToken}`;
  const rfLink = `${req.protocol}://${req.headers.host}/auth/NewConfirmEmail/${token}`;

  const html = `<!DOCTYPE html>
    <html>
    <head>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"></head>
    <style type="text/css">
    body{background-color: #88BDBF;margin: 0px;}
    </style>
    <body style="margin:0px;"> 
    <table border="0" width="50%" style="margin:auto;padding:30px;background-color: #F3F3F3;border:1px solid #630E2B;">
    <tr>
    <td>
    <table border="0" width="100%">
    <tr>
    <td>
    <h1>
        <img width="100px" src="https://res.cloudinary.com/ddajommsw/image/upload/v1670702280/Group_35052_icaysu.png"/>
    </h1>
    </td>
    <td>
    <p style="text-align: right;"><a href="http://localhost:4200/#/" target="_blank" style="text-decoration: none;">View In Website</a></p>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    <tr>
    <td>
    <table border="0" cellpadding="0" cellspacing="0" style="text-align:center;width:100%;background-color: #fff;">
    <tr>
    <td style="background-color:#630E2B;height:100px;font-size:50px;color:#fff;">
    <img width="50px" height="50px" src="${process.env.logo}">
    </td>
    </tr>
    <tr>
    <td>
    <h1 style="padding-top:25px; color:#630E2B">Email Confirmation</h1>
    </td>
    </tr>
    <tr>
    <td>
    <p style="padding:0px 100px;">
    </p>
    </td>
    </tr>
    <tr>
    <td>
    <a href="${link}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">Verify Email Address</a>
    </td>
    </tr>
    <tr>
    <td>
    <br>
    <br>
    <br>
    <br>
    <br>
    <br>
    <br>
    <br>
    <a href="${rfLink}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">Request New  Email </a>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    <tr>
    <td>
    <table border="0" width="100%" style="border-radius: 5px;text-align: center;">
    <tr>
    <td>
    <h3 style="margin-top:10px; color:#000">Stay in touch</h3>
    </td>
    </tr>
    <tr>
    <td>
    <div style="margin-top:20px;">

    <a href="${process.env.facebookLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35062_erj5dx.png" width="50px" hight="50px"></span></a>
    
    <a href="${process.env.instegram}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35063_zottpo.png" width="50px" hight="50px"></span>
    </a>
    
    <a href="${process.env.twitterLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group_35064_i8qtfd.png" width="50px" hight="50px"></span>
    </a>

    </div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </body>
    </html>`;

  if (!(await sendEmail({ to: email, subject: "Confirmation-Email", html }))) {
    return res.status(400).json({ message: "Email Rejected" });
  }
  return res.status(200).send({
    sucess: true,
    message: "New confirmation email sent to your inbox",
  });
});

export const signIn = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  //check email exist
  const user = await userModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new Error("Email  not exist", { cause: 404 }));
  }

  if (!user.confirmEmail) {
    return next(new Error("Please confirm your email", { cause: 400 }));
  }
  if (!compare({ plaintext: password, hashValue: user.password })) {
    return next(new Error("In-valid login data", { cause: 400 }));
  }
  const access_token = generateToken({
    payload: { id: user._id, role: user.role },
    expiresIn: 30 * 60,
  });
  const refresh_token = generateToken({
    payload: { id: user._id, role: user.role },
    expiresIn: 60 * 60 * 24 * 365,
  });

  user.status = "online";
  await user.save();
  return res.status(201).json({
    success: true,
    message: "Logged in successfully",
    access_token,
    refresh_token,
    user,
  });
});

export const sendCode = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const forgetCode = customAlphabet("123456789", 4);
  const user = await userModel.findOneAndUpdate(
    { email: email.toLowerCase() },
    { code: forgetCode() },
    { new: true }
  );
  if (!user) {
    return next(new Error("Not register account", { cause: 404 }));
  }

  const html = `<!DOCTYPE html>
    <html>
    <head>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"></head>
    <style type="text/css">
    body{background-color: #88BDBF;margin: 0px;}
    </style>
    <body style="margin:0px;"> 
    <table border="0" width="50%" style="margin:auto;padding:30px;background-color: #F3F3F3;border:1px solid #630E2B;">
    <tr>
    <td>
    <table border="0" width="100%">
    <tr>
    <td>
    <h1>
        <img width="100px" src="https://res.cloudinary.com/ddajommsw/image/upload/v1670702280/Group_35052_icaysu.png"/>
    </h1>
    </td>
    <td>
    <p style="text-align: right;"><a href="http://localhost:4200/#/" target="_blank" style="text-decoration: none;">View In Website</a></p>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    <tr>
    <td>
    <table border="0" cellpadding="0" cellspacing="0" style="text-align:center;width:100%;background-color: #fff;">
    <tr>
    <td style="background-color:#630E2B;height:100px;font-size:50px;color:#fff;">
    <img width="50px" height="50px" src="${process.env.logo}">
    </td>
    </tr>
    <tr>
    <td>
    <h1 style="padding-top:25px; color:#630E2B">Reset Password Code</h1>
    </td>
    </tr>
    <tr>
    <td>
    <p style="padding:0px 100px;">
    </p>
    </td>
    </tr>
    <tr>
    <td>
    <p style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B;font-size:20px; ">${user.code}</p>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    <tr>
    <td>
    <table border="0" width="100%" style="border-radius: 5px;text-align: center;">
    <tr>
    <td>
    <h3 style="margin-top:10px; color:#000">Stay in touch</h3>
    </td>
    </tr>
    <tr>
    <td>
    <div style="margin-top:20px;">

    <a href="${process.env.facebookLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35062_erj5dx.png" width="50px" hight="50px"></span></a>
    
    <a href="${process.env.instegram}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35063_zottpo.png" width="50px" hight="50px"></span>
    </a>
    
    <a href="${process.env.twitterLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group_35064_i8qtfd.png" width="50px" hight="50px"></span>
    </a>

    </div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </body>
    </html>`;

  if (!(await sendEmail({ to: email, subject: "Forget Password", html }))) {
    return res.status(400).json({ message: "Email Rejected" });
  }
  return res.status(200).json({
    success: true,
    message: "Code sent successfully, check your email",
  });
});

export const forgetPassword = asyncHandler(async (req, res, next) => {
  const { email, code, password } = req.body;

  const user = await userModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new Error("Not register account", { cause: 404 }));
  }
  if (user.code != parseInt(code)) {
    return next(new Error("In-valid code", { cause: 400 }));
  }
  user.password = hash({ plaintext: password });
  user.code = null;
  user.changePasswordTime = Date.now();
  await user.save();
  return res
    .status(200)
    .json({ success: true, message: "Password changed successfully" });
});
