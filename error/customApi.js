class CustomApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}
//this class component holds any error message and display them

module.exports = CustomApiError;
