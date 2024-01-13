const axios = require("axios");
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
    // Select each question container
    $(".questions").each((index, questionContainer) => {
      const questionObject = {};

      // Check if the question container contains an image
      if ($(questionContainer).find(".question-title img").length === 0) {
        // Get the question text without numbers
        const questionText = $(questionContainer)
          .find(".question-title")
          .text()
          .replace(/\d+\.\s/, "")
          .trim();
        questionObject.questionText = questionText;
        questionObject.difficulty = difficulty;
        questionObject.exam = exam;
        questionObject.subject = subject;

        // Get the options array (sub-questions)
        const optionsArray = [];
        $(questionContainer)
          .find(".sub-question")
          .each((i, subElement) => {
            optionsArray.push(
              $(subElement)
                .text()
                .trim()
                .replace(/^\w+\.\s/, ""),
            ); // Remove 'a.', 'b.', etc.
          });
        questionObject.options = optionsArray;

        // Get the correct option as array index
        const answerElement = $(questionContainer)
          .find(".sub-answer")
          .find("strong")
          .text()
          .trim();
        const correctOptionLabel = answerElement
          .slice(answerElement.indexOf("(") + 1, answerElement.indexOf(")"))
          .toLowerCase(); // Extract 'a', 'b', etc.
        questionObject.correctOption =
          correctOptionLabel.charCodeAt(0) - "a".charCodeAt(0); // Convert 'a' to 0, 'b' to 1, etc.

        // Push the question object to the array
        questionsArray.push(questionObject);
      }
    });
    // sendData(questionsArray)
    console.log(questionsArray);
  })
  .catch((error) => {
    console.error(`Error fetching data from ${url}: ${error.message}`);
  });
function sendData(data) {
  // Replace 'your-api-endpoint' with the actual endpoint you want to send data to
  const apiUrl = "http://localhost:4040/admin/addMQuestion";

  axios
    .post(apiUrl, data)
    .then((response) => {
      console.log("Data sent successfully:", response.data);
    })
    .catch((error) => {
      console.error("Error sending data:", error);
    });
}
