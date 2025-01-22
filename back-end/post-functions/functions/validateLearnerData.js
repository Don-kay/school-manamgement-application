const validateLearnerData = (data) => {
  const {
    firstname,
    othernames,
    dob,
    age,
    gender,
    date_on_admission,
    image,
    nationality,
    parent_id,
  } = data;
  if (
    !firstname ||
    !othernames ||
    !dob ||
    !age ||
    !gender ||
    !date_on_admission ||
    !image ||
    !nationality ||
    !parent_id
  ) {
    return false;
  } else {
    return true;
  }
};

module.exports = validateLearnerData;
