const generateUniqueId = (uuid, code) => {
  const timestamp = process.hrtime.bigint().toString();
  const randomNumber = Math.floor(Math.random() * 1e12);

  const UniqueId = `${uuid}-${timestamp}-${randomNumber}+${code}`;

  return UniqueId;
};

module.exports = generateUniqueId;
