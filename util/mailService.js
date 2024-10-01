const nodemailer = require("nodemailer");
const sgTransport = require("nodemailer-sendgrid-transport");

const SENDGRID_API_KEY =
  "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";

const options = {
  auth: {
    api_key: SENDGRID_API_KEY,
  },
};

module.exports = nodemailer.createTransport(sgTransport(options));
