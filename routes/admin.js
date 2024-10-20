const path = require("path");

const express = require("express");

const adminController = require("../controllers/admin");

const isAuth = require("../middleware/is-auth");

const { check, body } = require("express-validator/check");

const router = express.Router();

// /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get("/products", isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
  "/add-product",
  isAuth,
  [check("price").isNumeric().withMessage("Price enter a valid price")],
  adminController.postAddProduct
);

router.get(
  "/edit-product/:productId",
  isAuth,
  [check("price").isNumeric().withMessage("Price enter a valid price")],
  adminController.getEditProduct
);

router.post("/edit-product", isAuth, adminController.postEditProduct);

router.delete("/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;
