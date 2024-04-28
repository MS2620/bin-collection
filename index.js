const express = require("express");
const data = require("./data.json");
const moment = require("moment");

const app = express();

app.get("/", (req, res) => {
  res.send("Hi there!");
});

// Route to get the next collection day for the current month
app.get("/next-collection", (req, res) => {
  const today = moment(); // Get current date
  const currentMonth = today.format("MMMM"); // Get current month name

  // Find the data for the current month
  const monthData = data.find(
    (item) => item.month.toLowerCase() === currentMonth.toLowerCase()
  );

  // If no data found for current month
  if (!monthData) {
    res.status(404).send("No data found for the current month");
    return;
  }

  // Find the next collection day after today
  const nextCollection = monthData.collection_days.find((day) =>
    moment(day.date, "DD-MM-YYYY").isAfter(today)
  );

  // If no upcoming collection day found
  if (!nextCollection) {
    res
      .status(404)
      .send("No upcoming collection day found for the current month");
    return;
  }

  // Format the response message
  let responseMessage;
  const nextCollectionDate = moment(nextCollection.date, "DD-MM-YYYY");
  if (nextCollectionDate.isSame(today.clone().add(1, "days"), "day")) {
    responseMessage = `The next collection day is tomorrow, for ${nextCollection.bin_collection}.`;
  } else {
    responseMessage = `The next collection day is on ${nextCollectionDate.format(
      "dddd, MMMM Do YYYY"
    )}, for ${nextCollection.bin_collection}.`;
  }

  // Send the response message
  res.send(responseMessage);
});

app.listen(3000, () => console.log("Example app is listening on port 3000."));
