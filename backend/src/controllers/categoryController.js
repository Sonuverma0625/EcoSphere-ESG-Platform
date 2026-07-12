const Category = require('../models/Category');
const { parseQueryParams } = require('../utils/apiFeatures');

// @desc    Get all categories (Searchable, Filterable)
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    const { filter, skip, limit, sort, page } = parseQueryParams(req.query, ['name']);
    
    // Support non-paginated listing for dropdown menus (if query.all is passed)
    let categories;
    let total;

    if (req.query.all === 'true') {
      categories = await Category.find(filter).sort({ name: 1 });
      total = categories.length;
      return res.status(200).json({
        success: true,
        data: {
          categories,
          pagination: { total, page: 1, pages: 1, limit: total }
        }
      });
    }

    categories = await Category.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    total = await Category.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: {
        categories,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error(`[Cat Get Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving categories'
    });
  }
};

// @desc    Get a single category
// @route   GET /api/categories/:id
// @access  Private
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    return res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error(`[Cat GetId Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error retrieving category details'
    });
  }
};

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private (Admin Only)
const createCategory = async (req, res) => {
  try {
    const { name, type, status } = req.body;

    const trimmedName = name.trim();

    // Prevent duplicate category names within the same type
    const categoryExists = await Category.findOne({ name: trimmedName, type });
    if (categoryExists) {
      return res.status(400).json({
        success: false,
        message: `A category named "${trimmedName}" already exists for type "${type}"`
      });
    }

    const category = await Category.create({
      name: trimmedName,
      type,
      status: status || 'Active'
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error(`[Cat Create Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error creating category'
    });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private (Admin Only)
const updateCategory = async (req, res) => {
  try {
    const { name, type, status } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const updatedType = type || category.type;
    const updatedName = name !== undefined ? name.trim() : category.name;

    if (updatedName !== category.name || updatedType !== category.type) {
      // Check collision
      const collision = await Category.findOne({ name: updatedName, type: updatedType });
      if (collision) {
        return res.status(400).json({
          success: false,
          message: `A category named "${updatedName}" already exists for type "${updatedType}"`
        });
      }
      category.name = updatedName;
      category.type = updatedType;
    }

    if (status !== undefined) category.status = status;

    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error(`[Cat Update Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error updating category'
    });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Admin Only)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check references in CSRActivity and Challenge
    const CSRActivity = require('../models/CSRActivity');
    const Challenge = require('../models/Challenge');

    const inCSR = await CSRActivity.exists({ category: req.params.id });
    const inChallenge = await Challenge.exists({ category: req.params.id });

    if (inCSR || inChallenge) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category: It is currently referenced by active activities or challenges'
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error(`[Cat Delete Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server Error deleting category'
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
