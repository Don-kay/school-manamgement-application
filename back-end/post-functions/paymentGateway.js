const { connection } = require("../config/connection");
const { StatusCodes } = require("http-status-codes");
const ProcessPayment = require("./paymentFunction/processPayment");
const { BadRequestError } = require("../error");

const PaymentGateway = async (
  invoice_id,
  payUpdates,
  p_insertId,
  invoiceUpdate,
  i_insertId
) => {
  // Helper function to build the SQL query and values array
  const buildInsertQuery = (tableName, data) => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => "?").join(", ");
    const query = `INSERT INTO ${tableName} (${keys.join(
      ", "
    )}) VALUES (${placeholders})`;
    return { query, values };
  };
  //console.log(payUpdates);
  // Initialize transaction
  const transctionConnect = await connection.getConnection();
  await transctionConnect.beginTransaction();

  try {
    // Fetch the existing invoice
    const [[invoice]] = await connection.execute(
      `SELECT outstanding_balance, amount_due, parent_id FROM invoices WHERE invoice_id = ?`,
      [invoice_id]
    );

    let proceed = false;

    if (!invoice && invoiceUpdate) {
      // Insert the invoice if it doesn't exist
      const { query: queryInvoice, values: valuesInv } = buildInsertQuery(
        "invoices",
        invoiceUpdate
      );

      const [invoiceResult] = await connection.execute(queryInvoice, valuesInv);
      if (invoiceResult.affectedRows > 0) {
        proceed = true;
      } else {
        throw new BadRequestError("Failed to generate invoice");
      }
    } else {
      proceed = true;
    }

    if (proceed) {
      const { query: queryPayment, values: valuesPay } = buildInsertQuery(
        "payment_status",
        payUpdates
      );

      const processpayment = await ProcessPayment(
        proceed,
        queryPayment,
        valuesPay,
        p_insertId,
        invoice_id,
        connection,
        payUpdates
      );

      await transctionConnect.commit();
      return processpayment;
    }
  } catch (error) {
    await transctionConnect.rollback();
    // error.statusCode = error.statusCode === undefined ? 500 : error.statusCode;
    throw error;
  } finally {
    transctionConnect.release();
  }
};

module.exports = PaymentGateway;
