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

// Get products by subcategory
const getProductsBySubcategory = async (req, res) => {
  try {
    const { subcategory } = req.query;

    if (!subcategory) {
      return res.status(400).json({
        success: false,
        message: "Subcategory parameter is required",
      });
    }

    // Case-insensitive search for subcategory in the array
    const products = await Product.find({
      subcategory: {
        $elemMatch: {
          $regex: new RegExp(subcategory, 'i')
        }
      }
    });

    res.json({
      success: true,
      count: products.length,
      subcategory,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products by subcategory",
      error: error.message,
    });
  }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category parameter is required",
      });
    }

    // Case-insensitive match inside category array
    const products = await Product.find({
      category: {
        $elemMatch: {
          $regex: new RegExp(category, 'i')
        }
      }
    });

    res.json({
      success: true,
      count: products.length,
      category,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products by category",
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


const getCategoriesSubcategories = async (req, res) => {
  try {
    console.log('[DEBUG] Fetching all products for categories...');
    const products = await Product.find({}).lean();
    console.log(`[DEBUG] Found ${products.length} products`);
    
    if (!products || products.length === 0) {
      console.log('[INFO] No products found in the database');
      return res.json({
        success: true,
        categories: [],
        subcategories: []
      });
    }

    // Extract unique categories with better error handling
    const categories = [...new Set(products.flatMap(p => {
      try {
        return Array.isArray(p.category) 
          ? p.category.map(c => String(c || '').trim()).filter(Boolean)
          : [String(p.category || '').trim()].filter(Boolean);
      } catch (error) {
        console.error('[ERROR] Error processing product category:', p?._id, error);
        return [];
      }
    }))];

    // Extract category-subcategory pairs with better error handling
    const subcategories = products.flatMap(product => {
      try {
        if (!product.category || !product.subcategory) return [];
        
        const categories = Array.isArray(product.category) 
          ? product.category.map(c => String(c || '').trim())
          : [String(product.category || '').trim()];
        
        const subcategories = Array.isArray(product.subcategory)
          ? product.subcategory.map(s => String(s || '').trim())
          : [String(product.subcategory || '').trim()];
        
        return categories.flatMap(cat => 
          subcategories.map(sub => ({
            category: cat,
            subcategory: sub
          }))
        ).filter(item => item.category && item.subcategory);
      } catch (error) {
        console.error('[ERROR] Error processing product:', product?._id, error);
        return [];
      }
    });

    // Remove duplicates
    const uniqueSubs = Array.from(
      new Map(subcategories.map(item => 
        [`${item.category}-${item.subcategory}`, item]
      )).values()
    );

    console.log(`[DEBUG] Found ${categories.length} unique categories`);
    console.log(`[DEBUG] Found ${uniqueSubs.length} unique subcategories`);

    res.json({
      success: true,
      categories: categories.filter(Boolean),
      subcategories: uniqueSubs
    });

  } catch (error) {
    console.error('Error in getCategoriesSubcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories and subcategories',
      error: error.message
    });
  }
};


// const updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = { ...req.body };

//     // Handle category and subcategory
//     if (updateData.category) {
//       updateData.category = typeof updateData.category === "string"
//         ? updateData.category.split(",").map((cat) => cat.trim())
//         : updateData.category;
//     }

//     if (updateData.subcategory) {
//       updateData.subcategory = typeof updateData.subcategory === "string"
//         ? updateData.subcategory.split(",").map((sub) => sub.trim())
//         : updateData.subcategory;
//     }

//     // Handle sizes and colors
//     if (updateData.availableSizes && !Array.isArray(updateData.availableSizes)) {
//       updateData.availableSizes = [updateData.availableSizes];
//     }
//     if (updateData.availableColors && !Array.isArray(updateData.availableColors)) {
//       updateData.availableColors = [updateData.availableColors];
//     }

//     // Fetch existing product
//     const existingProduct = await Product.findById(id);
//     if (!existingProduct) {
//       return res.status(404).json({ success: false, message: "Product not found" });
//     }

//     // Discount calculation logic
//     if (updateData.discountPercent && updateData.discountPercent > 0) {
//       const now = new Date();
//       const startDate = updateData.offerStartDate ? new Date(updateData.offerStartDate) : null;
//       const endDate = updateData.offerEndDate ? new Date(updateData.offerEndDate) : null;

//       // Offer active check
//       if ((!startDate || now >= startDate) && (!endDate || now <= endDate)) {
//         updateData.oldPrice = existingProduct.price; // original price
//         // Round discounted price to whole number
//         updateData.price = Math.round(existingProduct.price * (1 - updateData.discountPercent / 100));
//       } else {
//         updateData.price = existingProduct.price;
//         updateData.oldPrice = null;
//       }
//     } else {
//       // No discount, reset
//       updateData.oldPrice = null;
//       updateData.price = existingProduct.price;
//     }

//     // Update product in DB
//     const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     res.json({
//       success: true,
//       product: updatedProduct,
//     });

//   } catch (error) {
//     console.error("Update product error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error updating product",
//       error: error.message,
//     });
//   }
// };



// Delete product


const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle category and subcategory
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

    // Handle sizes and colors
    if (updateData.availableSizes && !Array.isArray(updateData.availableSizes)) {
      updateData.availableSizes = [updateData.availableSizes];
    }
    if (updateData.availableColors && !Array.isArray(updateData.availableColors)) {
      updateData.availableColors = [updateData.availableColors];
    }

    // Fetch existing product
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Discount logic
    if (updateData.discountPercent && updateData.discountPercent > 0) {
      const now = new Date();
      const startDate = updateData.offerStartDate ? new Date(updateData.offerStartDate) : null;
      const endDate = updateData.offerEndDate ? new Date(updateData.offerEndDate) : null;

      // Offer active check
      if ((!startDate || now >= startDate) && (!endDate || now <= endDate)) {
        updateData.oldPrice = existingProduct.price; // store original price
        updateData.price = Math.round(existingProduct.price * (1 - updateData.discountPercent / 100));
      } else {
        // offer not active
        updateData.oldPrice = null;
        if (!updateData.price) updateData.price = existingProduct.price;
      }
    } else {
      // No discount, allow manual price update if provided
      updateData.oldPrice = null;
      if (updateData.price == null) {
        // If price not provided, keep existing
        updateData.price = existingProduct.price;
      }
    }

    // Update product in DB
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

module.exports = { updateProduct };


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
  getProductsBySubcategory,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductList,
  getCategoriesSubcategories,
};

