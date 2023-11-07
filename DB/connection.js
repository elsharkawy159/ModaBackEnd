import mongoose from "mongoose";
mongoose.set("strictQuery", false);
const connectDB = async () => {
  return await mongoose
    .connect(
      "mongodb+srv://elsharkawy159om:i8Kn85BKTqYlrAeX@cluster0.c4q4sop.mongodb.net/"
    )
    .then(console.log("DB Connection established"))
    .catch((err) => console.log(` Fail to connect  DB.........${err} `));
};

export default connectDB;
