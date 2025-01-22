function sumObjectValues(obj) {
  if (!obj || typeof obj !== "object") {
    throw new Error("Input must be a valid object.");
  }

  return Object.values(obj).reduce((total, value) => {
    if (typeof value === "number") {
      return total + value;
    }
    return total;
  }, 0);
}

module.exports = sumObjectValues;
