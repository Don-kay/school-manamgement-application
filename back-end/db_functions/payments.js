const PaymentgateWay = require("../post-functions/paymentGateway");
const ValidatePayments = require("../post-functions/paymentFunction/validatePaymentData");
const { StatusCodes } = require("http-status-codes");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const {
  BadRequestError,
  MissingFieldsError,
  Success,
} = require("../error/index");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");

// console.log(parentsLearnerId);

const Payments = {
  oneOffPayment: async (payment) => {
    try {
      const {
        payment_id,
        parent_id,
        term_id,
        session_id,
        learner_id,
        invoice_id,
        section_id,
        level_id,
      } = payment;
      const { amount_due, ...newObj } = payment;
      const invoiceData = {
        learner_id,
        session_id,
        term_id,
        section_id,
        level_id,
      };

      if (!ValidatePayments(newObj)) {
        throw new MissingFieldsError(
          "Invalid payment details, please fill all necessary fields and try again"
        );
      }
      const [confirmTerm, confirmYearlevel, confirmSession] = await Promise.all(
        [
          checkoneExistence("terms", "term_id", term_id),
          checkoneExistence("year_level", "level_id", level_id),
          checkoneExistence("academic_session", "session_id", session_id),
        ]
      );

      if (!confirmTerm || !confirmYearlevel || !confirmSession) {
        throw new BadRequestError(
          "Invalid payment details, recheck your details and try again"
        );
      }

      const existingInvoices = await Promise.all([
        checkallExistence("invoices", invoiceData),
        checkallExistence("invoices", { learner_id, level_id, session_id }),
        checkallExistence("invoices", { learner_id, term_id, session_id }),
        checkallExistence("invoices", { learner_id, session_id }),
      ]);

      const [
        invoiceExists,
        invoicePerLevel,
        invoicePerTerm,
        invoicePerSession,
      ] = existingInvoices;

      if (invoiceExists) {
        throw new BadRequestError(
          "Invoice already exists. Please complete the existing invoice order."
        );
      }

      if (invoicePerTerm) {
        throw new BadRequestError(
          "Payment for the term/session has already been made."
        );
      }

      if (invoicePerSession && !invoicePerTerm && !invoicePerLevel) {
        throw new BadRequestError(
          "Payment for the session has already been made."
        );
      }

      //console.log("proceed to payment");
      const invoiceColumns = {
        parent_id,
        learner_id,
        amount_due,
        outstanding_balance: "0",
        amount_paid: 0,
        status: "pending",
        invoice_id,
        term_id,
        section_id,
        session_id,
        level_id,
      };
      const result = await PaymentgateWay(
        invoice_id,
        newObj,
        payment_id,
        invoiceColumns
      );
      return result;
    } catch (error) {
      // console.log(error);
      // error.statusCode = err.statusCode === undefined ? 500 : error.statusCode;
      throw error;
    }
  },

  installment: async (payment) => {
    try {
      const {
        invoice_id,
        term_id,
        session_id,
        payment_id,
        section_id,
        level_id,
        parent_id,
      } = payment;
      // const { amount_due, ...newObj } = payment;

      const invoicePending = await checkallExistence("invoices", {
        invoice_id,
        term_id,
        session_id,
        section_id,
        level_id,
        parent_id,
        status: "pending",
      });
      const invoiceCompleted = await checkallExistence("invoices", {
        invoice_id,
        term_id,
        session_id,
        section_id,
        level_id,
        parent_id,
        status: "paid",
      });

      if (!ValidatePayments(payment)) {
        throw new MissingFieldsError(
          "Invalid payment data, fill all payment details"
        );
      }
      if (invoicePending) {
        const data = await PaymentgateWay(
          invoice_id,
          payment,
          payment_id
          // column
          // parent_id
        );
        return data;
      }
      if (invoiceCompleted) {
        throw new Success("Invoice Payment Received in Full");
      } else {
        throw new BadRequestError(
          "invoice invalid ::) payment not authorized, please recheck details and try again"
        );
      }
    } catch (error) {
      throw error;
    }
  },
};

module.exports = Payments;
