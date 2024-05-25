const axios = require("axios");
const fs = require("fs");
const Jimp = require("jimp");
const cheerio = require("cheerio");

let ignoreArray = [];
let addBook = 1;
let height1 = 0.1 * addBook;
let width1 = 0.2 * addBook;
let url;
let difficulty = "Medium";
let exam = "jee";
let subject = "math";

// fs.writeFileSync("data.json", "", (err) => {
//   if (err) {
//     console.error("Error emptying the file:", err);
//     return;
//   }
//   console.log("File emptied successfully.");
// });

// (async () => {
//   url =
//     "https://byjus.com/jee/jee-main-2018-question-paper-maths-jan-10-shift-1/";
//   difficulty = "Medium";
//   exam = "jee";
//   subject = "math";
//   await getData(url,difficulty,exam,subject)  ;
//   })();

async function getData(url1,difficulty1,exam1,subject1) {
  await axios
    .get(url1)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);
      let questionsArray = [];
      $(".questions").each((index, questionContainer) => {
        if (!ignoreArray.includes(index + 1)) {
          const questionObject = {};

          const questionText = $(questionContainer)
            .find(".question-title")
            .text()
            .trim()
            .replace(
              /(?:^\(\w\)|^[a-zA-Z])\)|^\(\w\)|^\w+\.\s|^\b\d+\)\s/g,
              ""
            );
          questionObject.questionText = questionText;
          questionObject.difficulty = difficulty1;
          questionObject.exam = exam1;
          questionObject.subject = subject1;
          if ($(questionContainer).find(".question-title img").length != 0) {
            const img = $(questionContainer)
              .find(".question-title img")
              .attr("src");
            questionObject.img = img;
          }
          const optionsArray = [];
          $(questionContainer)
            .find(".sub-question")
            .each((i, subElement) => {
              optionsArray.push(
                $(subElement)
                  .text()
                  .trim()
                  .replace(
                    /(?:^\(\w\)|^[a-zA-Z])\)|^\(\w\)|^\w+\.\s|^\b\d+\)\s/g,
                    ""
                  )
              );
            });
          questionObject.options = optionsArray;

          const answerElement = $(questionContainer)
            .find(".sub-answer")
            .find("strong")
            .text()
            .trim()
            .replace(/[^A-Za-z0-9]/gi, "");
          const correctOptionLabel = answerElement.charAt(
            answerElement.length - 1
          );

          if (correctOptionLabel == parseInt(correctOptionLabel)) {
            questionObject.correctOption = parseInt(correctOptionLabel) - 1;
          } else {
            questionObject.correctOption =
              correctOptionLabel.charCodeAt(0) - "a".charCodeAt(0);
          }
          questionsArray.push(questionObject);
        }
      });
      questionsArray.forEach((item) => {
        if (
          !isNaN(item.correctOption) &&
          item.options.length == 4 &&
          item.questionText != ""
        ) {
          let newItem = { ...item, url: url1 };
          if (item.img) {
            newItem["bookMarkCover"] = false;
          }
          let existingData = [];
          try {
            existingData = JSON.parse(fs.readFileSync("data.json"));
          } catch (error) {
            console.error(`Error reading file data`);
          }
          const updatedData = existingData.concat(newItem);
          const updatedDataString = JSON.stringify(updatedData, null, 2);
          fs.writeFileSync("data.json", updatedDataString);
          console.log("Data appended successfully!");
          // sendData(item);
        }
      });
          console.log(url1);
    })
    .catch((error) => {
      console.error(`Error fetching data from ${url}: ${error.message}`);
    });
}

fs.readFile("JeeMath.json", "utf8", (err, data) => {
  data = JSON.parse(data);
  data.forEach((item) => {
    sendData(item);
  });
});


function sendData(data) {
  const apiEndpoint = "http://localhost:4040/admin/addMQuestion";
  const formData = new FormData();
  if (data.img) {
    Promise.all([Jimp.read(data.img), Jimp.read("cover.png")])
      .then((images) => {
        const inputImage = images[0];
        const coverImage = images[1];

        const x = inputImage.getWidth() - inputImage.getWidth() * width1;
        const y = 0;

        const width = inputImage.getWidth() * width1;
        const height = inputImage.getWidth() * height1;

        coverImage.resize(width, height);

        inputImage.composite(coverImage, x, y);

        inputImage.getBufferAsync(Jimp.MIME_JPEG).then((imageBuffer) => {
          const blob = new Blob([imageBuffer], { type: Jimp.MIME_JPEG });
          formData.append("img", blob, "composite.png");

          formData.append("questionText", data.questionText);
          formData.append("options", JSON.stringify(data.options));
          formData.append("correctOption", data.correctOption);
          formData.append("exam", data.exam);
          formData.append("subject", data.subject);
          formData.append("difficulty", data.difficulty);

          axios
            .post(apiEndpoint, formData)
            .then((response) => {
              console.log(data);
              console.log("Image successfully sent to the API:", response.data);
            })
            .catch((err) => {
              console.log(data);
              console.error("Error:", err.message);
            });
        });
      })
      .catch((err) => {
        console.error(err);
      });
  } else {
    formData.append("questionText", data.questionText);
    formData.append("options", JSON.stringify(data.options));
    formData.append("correctOption", data.correctOption);
    formData.append("exam", data.exam);
    formData.append("subject", data.subject);
    formData.append("difficulty", data.difficulty);
    axios
      .post(apiEndpoint, formData)
      .then((response) => {
        console.log("Image successfully sent to the API:", response.data);
      })
      .catch((err) => {
        console.error("Error:", err.message);
      });
  }
}
