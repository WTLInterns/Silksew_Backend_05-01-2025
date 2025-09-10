const Product = require("../models/Product");

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// Get single product
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    res.json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      oldPrice,
      category,
      subcategory,
      availableStock,
      images,
      availableSizes,
      availableColors,
    } = req.body;

    // Process category and subcategory
    const processedCategory = typeof category === "string"
      ? category.split(",").map((cat) => cat.trim())
      : Array.isArray(category) ? category : [];

    const processedSubcategory = typeof subcategory === "string"
      ? subcategory.split(",").map((sub) => sub.trim())
      : Array.isArray(subcategory) ? subcategory : [];

    if (!processedCategory.length || !processedSubcategory.length) {
      return res.status(400).json({
        success: false,
        message: "Category and subcategory must be non-empty arrays or comma-separated strings",
      });
    }

    // ✅ Process availableColors
    const processedColors = Array.isArray(availableColors)
      ? availableColors.map((color) =>
          typeof color === "object" && color.name ? color.name.trim() : String(color).trim()
        )
      : [];

    // ✅ Process availableSizes
    const processedSizes = Array.isArray(availableSizes)
      ? availableSizes.map((size) =>
          typeof size === "object" && size.name ? size.name.trim() : String(size).trim()
        )
      : [];

    // ✅ Console logs
    console.log("Processed Colors:", processedColors);
    console.log("Processed Sizes:", processedSizes);

    const product = await Product.create({
      name,
      description,
      price,
      oldPrice,
      category: processedCategory,
      subcategory: processedSubcategory,
      availableStock,
      images: Array.isArray(images) ? images : [images],
      availableSizes: processedSizes,
      availableColors: processedColors,
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};



// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle category and subcategory conversion if they exist in update data
    if (updateData.category) {
      updateData.category = typeof updateData.category === "string"
        ? updateData.category.split(",").map((cat) => cat.trim())
        : updateData.category;
    }

    if (updateData.subcategory) {
      updateData.subcategory = typeof updateData.subcategory === "string"
        ? updateData.subcategory.split(",").map((sub) => sub.trim())
        : updateData.subcategory;
    }

    // Handle availableSizes and availableColors
    if (updateData.availableSizes && !Array.isArray(updateData.availableSizes)) {
      updateData.availableSizes = [updateData.availableSizes];
    }
    if (updateData.availableColors && !Array.isArray(updateData.availableColors)) {
      updateData.availableColors = [updateData.availableColors];
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

// Get product list (paginated)
// const getProductList = async (req, res) => {
//   try {
//     const { page = 1, limit = 10 } = req.query;

//     const products = await Product.find()
//       .skip((page - 1) * limit)
//       .limit(parseInt(limit));

//     const totalProducts = await Product.countDocuments();

//     res.json({
//       success: true,
//       totalProducts,
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(totalProducts / limit),
//       products,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching product list",
//       error: error.message,
//     });
//   }
// };

const getProductList = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 }); // ✅ newest first, no pagination

    res.json({
      success: true,
      totalProducts: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product list",
      error: error.message,
    });
  }
};




module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductList,
};
