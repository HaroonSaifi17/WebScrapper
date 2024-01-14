const axios = require("axios");
const Jimp = require("jimp");
const cheerio = require("cheerio");

const url = "https://byjus.com/jee/jee-main-2019-question-paper-physics-april/";
const difficulty = "Medium";
const exam = "jee";
const subject = "physics";
axios
  .get(url)
  .then((response) => {
    const html = response.data;
    const $ = cheerio.load(html);
    let questionsArray = [];
    $(".questions").each((index, questionContainer) => {
      const questionObject = {};

      const questionText = $(questionContainer)
        .find(".question-title")
        .text()
        .replace(/\d+\.\s/, "")
        .trim();
      questionObject.questionText = questionText;
      questionObject.difficulty = difficulty;
      questionObject.exam = exam;
      questionObject.subject = subject;
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
              .replace(/^\w+\.\s/, ""),
          );
        });
      questionObject.options = optionsArray;

      const answerElement = $(questionContainer)
        .find(".sub-answer")
        .find("strong")
        .text()
        .trim();
      const correctOptionLabel = answerElement
        .slice(answerElement.indexOf("(") + 1, answerElement.indexOf(")"))
        .toLowerCase();
      questionObject.correctOption =
        correctOptionLabel.charCodeAt(0) - "a".charCodeAt(0);
      questionsArray.push(questionObject);
    });
    questionsArray.forEach((item) => {
      if (
        !isNaN(item.correctOption) &&
        item.options.length == 4 &&
        item.questionText != ""
      ) {
        sendData(item);
      }
    });
  })
  .catch((error) => {
    console.error(`Error fetching data from ${url}: ${error.message}`);
  });
function sendData(data) {
  const apiEndpoint = "http://localhost:4040/admin/addMQuestion";
  const formData = new FormData();
  if (data.img) {
    Promise.all([Jimp.read(data.img), Jimp.read("cover.png")])
      .then((images) => {
        const inputImage = images[0];
        const coverImage = images[1];

        const x = inputImage.getWidth() - inputImage.getWidth() * 0.2;
        const y = 0;

        const width = inputImage.getWidth() * 0.2;
        const height = inputImage.getHeight() * 0.1;

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
        console.log(data);
        console.log("Image successfully sent to the API:", response.data);
      })
      .catch((err) => {
        console.log(data);
        console.error("Error:", err.message);
      });
  }
}
