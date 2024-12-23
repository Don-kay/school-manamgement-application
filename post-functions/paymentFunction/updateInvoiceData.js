const { BadRequestError } = require("../../error");
const FetchSingleData = require("../fetchSingleInputedData");

async function updateInvoiceData(payment, invoice, connection) {
  const totalAmountPaid =
    parseFloat(payment.amount) + parseFloat(invoice.amount_paid);
  const balance_accrued = parseFloat(invoice.amount_due) - totalAmountPaid;
  const outstanding_balance = Math.max(balance_accrued, 0.0);
  const isPaid = balance_accrued <= 0 ? "paid" : invoice.status;

  const updateValues = [
    outstanding_balance,
    isPaid,
    totalAmountPaid,
    payment.invoice_id,
    payment.invoice_id,
  ];
  const updateQuery = `
    UPDATE invoices
    SET outstanding_balance = ?, status = ?, amount_paid = ?, invoice_id = ?
    WHERE invoice_id = ?
  `;

  try {
    const [updateResult] = await connection.execute(updateQuery, updateValues);
    if (updateResult.affectedRows > 0 || updateResult.changedRows > 0) {
      const updated = await FetchSingleData(
        "invoices",
        "invoice_id",
        payment.invoice_id
      );
      if (
        Object.keys(updated).length === 0 ||
        updated === undefined ||
        updated.msg?.match(/[a-zA-Z]/)
      ) {
        return;
      }
      return updated;
    }
    throw new BadRequestError("failed to complete transaction");
  } catch (error) {
    // error.statusCode = err.statusCode === undefined ? 500 : error.statusCode;
    // error.message;
    throw error;
  }
}

module.exports = updateInvoiceData;
