const validateStaffData = (data) => {
  const {
    staff_id,
    firstname,
    address,
    title,
    surname,
    relationship_status,
    entry_role,
    current_role,
    dob,
    state_of_origin,
    age,
    city,
    email,
    experience,
    employment_date,
    employment_status,
    emergency_contact,
    emergency_name,
    nok_firstname,
    nok_surname,
    nok_address,
    nok_relationship,
    nok_phonenumber,
    nok_email,
    othernames,
    image,
    guarantor1_firstname,
    guarantor1_surname,
    guarantor1_address,
    guarantor1_phonenumber,
    guarantor1_title,
    guarantor1_proffession,
    guarantor1_image,
    guarantor1_email,
    guarantor2_firstname,
    guarantor2_surname,
    guarantor2_address,
    guarantor2_phonenumber,
    guarantor2_title,
    guarantor2_proffession,
    guarantor2_image,
    guarantor2_email,
    gender,
    nationality,
    identification_code,
  } = data;
  if (
    !staff_id ||
    !firstname ||
    !othernames ||
    !dob ||
    !age ||
    !gender ||
    !image ||
    !nationality ||
    !guarantor1_firstname ||
    !guarantor1_surname ||
    !guarantor1_address ||
    !guarantor1_phonenumber ||
    !guarantor1_title ||
    !guarantor1_proffession ||
    !guarantor1_image ||
    !guarantor1_email ||
    !guarantor2_firstname ||
    !guarantor2_surname ||
    !guarantor2_address ||
    !guarantor2_phonenumber ||
    !guarantor2_title ||
    !guarantor2_proffession ||
    !guarantor2_image ||
    !guarantor2_email ||
    !city ||
    !email ||
    !experience ||
    !employment_date ||
    !employment_status ||
    !emergency_contact ||
    !emergency_name ||
    !nok_firstname ||
    !nok_surname ||
    !nok_address ||
    !nok_relationship ||
    !nok_phonenumber ||
    !nok_email ||
    !address ||
    !title ||
    !surname ||
    !relationship_status ||
    !entry_role ||
    !current_role ||
    !state_of_origin ||
    !identification_code
  ) {
    return false;
  } else {
    return true;
  }
};

module.exports = validateStaffData;
