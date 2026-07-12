/**
 * Parse query filters, sorting, and pagination parameters consistently for Mongoose queries
 * @param {object} query - Express request query object (req.query)
 * @param {string[]} searchableFields - Model fields to query using Regex search
 * @returns {object} { filter, skip, limit, sort }
 */
const parseQueryParams = (query, searchableFields = []) => {
  const filter = {};

  // 1. Regex Search
  if (query.search && searchableFields.length > 0) {
    const searchRegex = new RegExp(query.search, 'i');
    filter.$or = searchableFields.map(field => ({ [field]: searchRegex }));
  }

  // 2. Exact matches
  const exactFields = ['status', 'department', 'employee', 'challenge', 'category', 'role', 'sourceModule', 'severity', 'assignedAuditor', 'owner'];
  exactFields.forEach(field => {
    if (query[field]) {
      filter[field] = query[field];
    }
  });

  // 3. Date Ranges
  if (query.startDate || query.endDate) {
    // Determine date field name based on typical filters (default transactionDate or createdAt)
    const dateField = query.dateField || 'createdAt';
    filter[dateField] = {};
    if (query.startDate) {
      filter[dateField].$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      // Set to end of that day
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter[dateField].$lte = end;
    }
  }

  // 4. Pagination
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // 5. Sorting
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  return {
    filter,
    skip,
    limit,
    sort,
    page
  };
};

module.exports = {
  parseQueryParams
};
