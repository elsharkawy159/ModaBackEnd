import mongoose from "mongoose";
const connectDB = async () => {
  return await mongoose
    .connect(process.env.DB)
    .then(console.log("DB Connection established"))
    .catch((err) => console.log(` Fail to connect  DB.........${err} `));
};

export default connectDB;
