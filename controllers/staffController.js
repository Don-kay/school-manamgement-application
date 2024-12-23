const StaffFunction = require("../db_functions/staff");
const { connection } = require("../config/connection");
const generateUUId = require("../post-functions/functions/generateUuid");
const validateStaffData = require("../post-functions/functions/validateStaffData");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  NotFoundError,
  MissingFieldsError,
  UnauthenticatedError,
} = require("../error");
const GenerateStaffCode = require("../post-functions/functions/generateschoolCode");
const fetchallExistence = require("../post-functions/fetchallExistence");
const checkallExistence = require("../post-functions/functions/checkallExistence");
const checkoneExistence = require("../post-functions/functions/checkoneExistence");
const { hashPassword } = require("../config/passwordConfig");
const FetchSingleData = require("../post-functions/fetchSingleInputedData");

const createStaff = async (req, res, next) => {
  const {
    phone_number,
    nok_phonenumber,
    guarantor2_phonenumber,
    guarantor1_phonenumber,
    nok_email,
    guarantor1_email,
    guarantor2_email,
    emergency_contact,
    image,
    email,
    entry_role,
    dob,
    title,
    age,
  } = req.body;

  const staffInputAge = dob.split("-")[0];
  const currentYear = new Date().getFullYear();
  const staffAge = currentYear - staffInputAge;

  const gender = title === "Mr" ? "male" : "female";

  const validatePhoneNumber = (phone, label) => {
    if (!/^\d{10}$/.test(phone)) {
      throw new BadRequestError(
        `Invalid ${label} phone number. Please enter a valid 10-digit number.`
      );
    }
  };

  const validateEmail = (email, label) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestError(
        `Invalid ${label} email address. Please enter a valid email.`
      );
    }
  };

  try {
    validatePhoneNumber(phone_number, "phone");
    validatePhoneNumber(nok_phonenumber, "next of kin");
    validatePhoneNumber(guarantor1_phonenumber, "guarantor1");
    validatePhoneNumber(guarantor2_phonenumber, "guarantor2");
    if (!/^\d+$/.test(emergency_contact) || emergency_contact.length < 7) {
      throw new BadRequestError(
        "Invalid emergency contact. Please enter a valid number."
      );
    }

    // Age validation
    if (age !== staffAge) {
      return next(
        new BadRequestError("Invalid age, please verify and try again.")
      );
    }

    // Email validations
    validateEmail(email, "user");
    validateEmail(nok_email, "next of kin");
    validateEmail(guarantor1_email, "guarantor1");
    validateEmail(guarantor2_email, "guarantor2");
    const duplicateStaff = await checkallExistence(
      "staff",
      {
        phone_number,
        email,
        image,
      },
      "OR"
    );

    if (duplicateStaff) {
      return next(
        new BadRequestError(
          "invalid credentials, the email/phone-number exist. You might be restricted from creating this staff if attempt persist"
        )
      );
    }

    const [code, [generalCode], [currentSession]] = await Promise.all([
      GenerateStaffCode("staff", "code"),
      fetchallExistence("general_tag", {
        current: "true",
      }),
      fetchallExistence("academic_session", {
        current: "true",
      }),
    ]);

    if (!currentSession) {
      return next(
        new NotFoundError("sorry, no current year set, please contact support")
      );
    }

    if (!generalCode) {
      return next(
        new NotFoundError(
          "sorry, school tag has not been set, please contact support"
        )
      );
    }

    const session_id = currentSession.session_id;
    const year = currentSession.session;

    const staff_id = await generateUUId("staff", "staff_id", "STAFF");

    const identification_code = `${generalCode?.tag}/${code}`;

    if (
      !staff_id ||
      staff_id === "failed to generate unique id after 10 attempts"
    ) {
      return next(
        new BadRequestError(
          "Failed to generate a unique staff ID. Please try again."
        )
      );
    }

    req.body = {
      ...req.body,
      identification_code,
      session_id,
      year,
      code,
      staff_id,
      personnel: "staff",
      current_role: entry_role,
      gender,
    };

    if (!validateStaffData(req.body)) {
      return next(
        new MissingFieldsError(
          " failed to create staff, please fill in all neccessary fields and try again"
        )
      );
    }

    const staffProp = await StaffFunction.create(req.body, staff_id);
    return res.status(StatusCodes.CREATED).json(staffProp);
  } catch (error) {
    // console.log(error);
    return next(error);
  }
};
const updateStaff = async (req, res, next) => {
  try {
    const { staffid: staff_id } = req.params;
    const { staff } = req;

    const staffId = staff.staff_id;

    const {
      phone_number,
      nok_phonenumber,
      guarantor2_phonenumber,
      guarantor1_phonenumber,
      nok_email,
      guarantor1_email,
      guarantor2_email,
      emergency_contact,
      email,
      current_role,
      entry_role,
      dob,
      age,
      title,
    } = req.body;

    const gender = title === "Mr" ? "male" : "female";

    if (staff_id !== staffId) {
      return next(
        new UnauthenticatedError(
          "you are not authorized to update user's profile."
        )
      );
    }

    // Calculate staff age based on DOB
    const staffInputYear = new Date(dob).getFullYear();
    const currentYear = new Date().getFullYear();
    const calculatedAge = currentYear - staffInputYear;

    // Helper functions
    const validatePhoneNumber = (phone, label = "") => {
      if (!/^\d{10}$/.test(phone)) {
        throw new BadRequestError(
          `Invalid ${label} phone number. Please provide a valid 10-digit number.`
        );
      }
    };

    const validateEmail = (email, label = "") => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new BadRequestError(
          `Invalid ${label} email. Please provide a valid email address.`
        );
      }
    };

    const validateEmergencyContact = (contact) => {
      if (!/^\d+$/.test(contact) || contact.length < 7) {
        throw new BadRequestError(
          "Invalid emergency contact. Please provide a valid number."
        );
      }
    };

    // Validate phone numbers
    [
      { phone: phone_number, label: "" },
      { phone: nok_phonenumber, label: "next of kin" },
      { phone: guarantor1_phonenumber, label: "guarantor1" },
      { phone: guarantor2_phonenumber, label: "guarantor2" },
    ].forEach(({ phone, label }) => validatePhoneNumber(phone, label));

    // Validate emails
    [
      { email, label: "user" },
      { email: nok_email, label: "next of kin" },
      { email: guarantor1_email, label: "guarantor1" },
      { email: guarantor2_email, label: "guarantor2" },
    ].forEach(({ email, label }) => validateEmail(email, label));

    // Validate emergency contact
    validateEmergencyContact(emergency_contact);

    // Age validation
    if (age !== calculatedAge) {
      throw new BadRequestError("Invalid age, please verify and try again.");
    }

    // Check if staff is authorized to update
    const isAuthorized = await checkoneExistence("staff", "staff_id", staff_id);
    if (!isAuthorized) {
      throw new BadRequestError("You are not authorized to make updates.");
    }

    // Check if phone number or email already exists
    const existingStaff = await checkallExistence(
      "staff",
      { phone_number, email },
      "OR"
    );

    // Remove conflicting fields if duplicates are found
    const updatedData = { ...req.body, gender };
    if (existingStaff) {
      if (existingStaff.phone_number) delete updatedData.phone_number;
      if (existingStaff.email) delete updatedData.email;
    }

    // Set role based on whether `entry_role` exists
    updatedData.current_role = entry_role || current_role;

    // Update staff details
    const updatedStaff = await StaffFunction.update(updatedData, staff_id);

    if (Object.hasOwn(updatedStaff, "logout")) {
      res
        .cookie("token", updatedStaff.logout, {
          httpOnly: false,
          secure: true,
          sameSite: "none",
          path: "/",
        })
        .status(StatusCodes.ACCEPTED)
        .json({
          message:
            "successfully updated, please login again for update to take effect",
        });
    } else {
      // // Respond with success
      return res.status(StatusCodes.CREATED).json(updatedStaff);
    }
  } catch (error) {
    return next(error);
  }
};

const createGeneralPassword = async (req, res, next) => {
  const { staffid: staff_id } = req.params;
  const { password } = req.body;

  const transactionConnect = await connection.getConnection();

  try {
    await transactionConnect.beginTransaction();

    // const staff = await FetchSingleData("staff", "staff_id", staff_id);

    // const isAuthorized = await checkoneExistence("staff", "staff_id", staff_id);

    // if (!isAuthorized) {
    //   transactionConnect.rollback();
    //   throw new BadRequestError(`you are not authorized to make updates.`);
    // }
    const hashPwd = await hashPassword(password);

    req.body.password = hashPwd;

    //Update parent properties
    const staffProp = await StaffFunction.setGeneralPassword(
      req.body,
      transactionConnect
    );

    // Respond with success
    transactionConnect.commit();
    return res
      .status(StatusCodes.CREATED)
      .json({ staffProp, msg: "general password has been successfully set" });
  } catch (error) {
    // Respond with error
    transactionConnect.rollback();
    return next(error);
  }
};
const assignStaffRole = async (req, res, next) => {
  const { staffid: staff_id } = req.params;

  const { role_id } = req.body;

  try {
    const roleExist = await checkoneExistence("roles", "role_id", role_id);
    const staffExist = await checkoneExistence("staff", "staff_id", staff_id);

    if (!roleExist) {
      throw new BadRequestError(`role doesn't exist.`);
    }
    if (!staffExist) {
      throw new BadRequestError(`staff doesn't exist.`);
    }

    const fetchRole = await FetchSingleData("roles", "role_id", role_id);

    const role = fetchRole?.role;

    req.body.current_role = role;

    // Update parent properties
    const assignRole = await StaffFunction.update(req.body, staff_id);

    // Respond with success
    return res.status(StatusCodes.CREATED).json({ assignRole });
  } catch (error) {
    // Respond with error
    return next(error);
  }
};

module.exports = {
  createStaff,
  updateStaff,
  assignStaffRole,
  createGeneralPassword,
};