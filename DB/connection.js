import mongoose from "mongoose";
const connectDB = async () => {
  return await mongoose
    .connect(
      "mongodb+srv://elsharkawy159om:I0e69oED9pjXcj5G@moda.lwgbtxr.mongodb.net/"
    )
    .then(console.log("DB Connection established"))
    .catch((err) => console.log(` Fail to connect  DB.........${err} `));
};

export default connectDB;
