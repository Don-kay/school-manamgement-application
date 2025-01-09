function FilterAllowedFields(body, allowedFields) {
  return Object.keys(body).reduce((filtered, key) => {
    if (allowedFields.includes(key)) {
      filtered[key] = body[key];
    }
    return filtered;
  }, {});
}

module.exports = { FilterAllowedFields };
