const express = require("express");
const data = require("../data.json");
const moment = require("moment");

const app = express();

app.get("/", (req, res) => {
  res.send("Hi there!");
});

// Route to get the next collection day for the current month
app.get("/next-collection", (req, res) => {
  const today = moment(); // Get current date
  let currentMonthIndex = today.month(); // Get current month index

  // Find the data for the current month
  let currentMonthData = data.find(
    (item) => moment(item.month, "MMMM").month() === currentMonthIndex
  );

  // If there is data for the current month
  if (currentMonthData) {
    // Find the next collection day after today
    const nextCollection = currentMonthData.collection_days.find(
      (day) =>
        moment(day.date, "DD-MM-YYYY").isSame(today, "day") ||
        moment(day.date, "DD-MM-YYYY").isAfter(today)
    );

    // If upcoming collection day found
    if (nextCollection) {
      // Format the response message
      let responseMessage;
      const nextCollectionDate = moment(nextCollection.date, "DD-MM-YYYY");

      // If today is the collection day and it's before noon
      if (
        moment().isSame(today, "day") &&
        moment().isBefore(moment().hour(12), "hour")
      ) {
        responseMessage = `Today is a collection day, for ${nextCollection.bin_collection}.`;
      } else if (moment().isSame(today, "day")) {
        let nextMonth = today.clone().add(1, "month").month();

        // Find the data for the next month
        let nextMonthData = data.find(
          (item) => moment(item.month, "MMMM").month() === nextMonth
        );

        if (nextMonthData) {
          let nextMonthCollection = nextMonthData.collection_days.find(
            (day) =>
              moment(day.date, "DD-MM-YYYY").isSame(today, "day") ||
              moment(day.date, "DD-MM-YYYY").isAfter(today)
          );

          if (nextMonthCollection) {
            const nextCollectionDate = moment(
              nextMonthCollection.date,
              "DD-MM-YYYY"
            );

            responseMessage = `Today was collection day, the next collection is ${nextCollectionDate.format(
              "dddd, MMMM Do YYYY"
            )}, for ${nextMonthCollection.bin_collection}.`;

            res.setHeader(
              "X-Collection-Date",
              nextCollectionDate.format("DD-MM-YYYY")
            );
          } else {
            responseMessage = `Today is not a collection day.`;
          }
        }
      } else if (
        nextCollectionDate.isSame(today.clone().add(1, "days"), "day")
      ) {
        responseMessage = `The next collection day is tomorrow, for ${nextCollection.bin_collection}.`;
      } else {
        responseMessage = `The next collection day is on ${nextCollectionDate.format(
          "dddd, MMMM Do YYYY"
        )}, for ${nextCollection.bin_collection}.`;

        res.setHeader(
          "X-Collection-Date",
          nextCollectionDate.format("DD-MM-YYYY")
        );
      }

      // Send the response message
      res.send(responseMessage);
      return;
    }
  }

  // Find the next month with available data
  let nextMonthData;
  while (!nextMonthData) {
    currentMonthIndex++;
    let nextMonth = today.clone().month(currentMonthIndex);
    let nextMonthName = nextMonth.format("MMMM");
    nextMonthData = data.find(
      (item) => item.month.toLowerCase() === nextMonthName.toLowerCase()
    );

    // If no data found for next month, return 404
    if (!nextMonthData) {
      res
        .status(404)
        .send("No upcoming collection day found for the current or next month");
      return;
    }
  }
  // Send the response message
  res.send(responseMessage);
});

app.listen(3000, () => console.log("Example app is listening on port 3000."));

module.exports = app;
