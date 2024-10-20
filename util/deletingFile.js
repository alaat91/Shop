const fs = require("fs");
const path = require("path");

const deleteFile = (filePath) => {
  const fileP = path.join(process.cwd(), filePath);
  console.log("path:", fileP);
  fs.unlink(fileP, (err) => {
    if (err) {
      throw err;
    }
  });
};

exports.deleteFile = deleteFile;
