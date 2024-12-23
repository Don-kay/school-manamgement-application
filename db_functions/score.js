const { connection } = require("../config/connection");
const FetchsingleData = require("../post-functions/fetchSingleInputedData");

const Parents = {
  create: async (score_input) => {
    const { learne_id, subject_id, term_Id, assessment_type_id, score } =
      score_input;

    await connection.query(
      "INSERT INTO parents (id, phone_number, surname, firstname, sex, nationality, state_of_origin, address, registered_kids, total_school_fees, email, othernames, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        phone_number,
        surname,
        firstname,
        sex,
        nationality,
        state_of_origin,
        address,
        registered_kids,
        total_school_fees,
        email,
        othernames,
        image,
      ]
    );
    //const response = result[0].insertId;
    const response = await FetchsingleData("parents", id);
    return response;
  },
};

module.exports = Parents;
