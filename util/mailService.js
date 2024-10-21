const nodemailer = require("nodemailer");
const sgTransport = require("nodemailer-sendgrid-transport");

const SENDGRID_API_KEY = process.env.SENDER_API_KEY;

const options = {
  auth: {
    api_key: SENDGRID_API_KEY,
  },
};

module.exports = nodemailer.createTransport(sgTransport(options));
// (react/angular/vue css html) (.net sql mongoDB testing) (aws azure) (docker microservises redis)
// Networking?/Protocols?
// ML D-ML NN DNN DE DS NLP LLM's 3+3+5+3+3+3+3
// C1 C2 LA SP
// SYS langs GO/C/RUST + LINUX cmnds
