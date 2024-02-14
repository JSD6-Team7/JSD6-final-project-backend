import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const jwtValidate = (req, res, next) => {
  try {
    if (!req.headers["authorization"]) {
      return res.sendStatus(401);
    }
    const token = req.headers["authorization"].replace("Bearer ", "");
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
      if (err) throw new Error(err);
      next();
    });
  } catch (e) {
    console.log(e);
    return res.sendStatus(403);
  }
};

export default jwtValidate;
