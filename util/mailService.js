const nodemailer = require("nodemailer");
const sgTransport = require("nodemailer-sendgrid-transport");

const SENDGRID_API_KEY = process.env.SENDER_API_KEY;

const options = {
  auth: {
    api_key: SENDGRID_API_KEY,
  },
};

module.exports = nodemailer.createTransport(sgTransport(options));
