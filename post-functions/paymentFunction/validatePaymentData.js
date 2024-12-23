const validatePaymentData = (data) => {
  const {
    invoice_id,
    amount,
    payment_method,
    term_id,
    level_id,
    session_id,
    section_id,
    learner_id,
    parent_id,
    payment_date,
  } = data;
  if (
    !invoice_id ||
    !amount ||
    !payment_method ||
    !term_id ||
    !level_id ||
    !session_id ||
    !section_id ||
    !learner_id ||
    !parent_id ||
    !payment_date ||
    payment_date === null ||
    payment_date === undefined ||
    payment_date === "0000-00-00  00:00:00"
  ) {
    return false;
  }
  if (isNaN(amount) || amount <= 0) {
    return false;
  } else {
    return true;
  }
};

module.exports = validatePaymentData;
