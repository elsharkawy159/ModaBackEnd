import mongoose from "mongoose";
mongoose.set("strictQuery", false);
const connectDB = async () => {
  return await mongoose
    .connect(
      "mongodb+srv://elsharkawy159om:I0e69oED9pjXcj5G@moda.lwgbtxr.mongodb.net/?retryWrites=true&w=majorityautoReconnect=true&socketTimeoutMS=360000&connectTimeoutMS=360000"
    )
    .then(console.log("DB Connection established"))
    .catch((err) => console.log(` Fail to connect  DB.........${err} `));
};

export default connectDB;
