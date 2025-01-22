const FetchSingleData = require("../fetchSingleInputedData");
const updateInvoiceData = require("./updateInvoiceData");
const { BadRequestError, DataError } = require("../../error/index");

async function ProcessPayment(
  proceed,
  query,
  values,
  p_insertId,
  invoice_id,
  connection,
  paymentAmount
) {
  try {
    if (!proceed) return { msg: "Payment not authorized" };
    const invoice = await FetchSingleData("invoices", "invoice_id", invoice_id);
    const accruedBalance =
      parseFloat(invoice.amount_due) - parseFloat(invoice.amount_paid);
    if (paymentAmount.amount > accruedBalance) {
      const [deleteInvoice] = await connection.execute(
        `DELETE FROM invoices WHERE invoice_id = ? AND outstanding_balance = ?`,
        [invoice_id, 0]
      );
      if (deleteInvoice.affectedRows > 0) {
        throw new BadRequestError(
          "Overpayment detected! Please recheck the deposit amount."
        );
      }
      throw new BadRequestError(
        "Overpayment detected! Please recheck the deposit amount./ failed to delete entry invoice"
      );
    }

    const [paymentData] = await connection.execute(query, values);
    if (paymentData.affectedRows === 0) {
      throw new DataError("Payment transaction failed");
    }

    const payment = await FetchSingleData(
      "payment_status",
      "payment_id",
      p_insertId
    );

    if (
      (payment.learner_id === invoice.learner_id &&
        payment.invoice_id === invoice.invoice_id) ||
      !payment?.match(/[a-zA-Z]/)
    ) {
      const updatedInvoice = await updateInvoiceData(
        payment,
        invoice,
        connection
      );
      if (updatedInvoice) {
        return { msg: "transaction successful", payment, updatedInvoice };
      }
    }

    throw new DataError("Payment transaction failed");
  } catch (error) {
    // error.statusCode = error.statusCode === undefined ? 500 : error.statusCode;
    // error.message;
    throw error;
  }
}

module.exports = ProcessPayment;
