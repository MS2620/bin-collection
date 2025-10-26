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
  const currentMonthIndex = today.month(); // Get current month index
  
  // Find the data for the current month
  let currentMonthData = data.find(
    (item) => moment(item.month, "MMMM").month() === currentMonthIndex
  );
  
  // Function to find the next collection day in a given month data
  const findNextCollectionDay = (monthData) => {
    return monthData.collection_days.find(
      (day) =>
        moment(day.date, "DD-MM-YYYY").isSame(today, "day") ||
        moment(day.date, "DD-MM-YYYY").isAfter(today)
    );
  };
  
  let responseMessage;
  let nextCollection;
  
  if (currentMonthData) {
    nextCollection = findNextCollectionDay(currentMonthData);
  }
  
  if (!nextCollection) {
    // Find the next month with available data
    let nextMonthData;
    let nextMonthIndex = currentMonthIndex;
    
    while (!nextMonthData) {
      nextMonthIndex++;
      let nextMonth = today.clone().month(nextMonthIndex);
      let nextMonthName = nextMonth.format("MMMM");
      
      nextMonthData = data.find(
        (item) => item.month.toLowerCase() === nextMonthName.toLowerCase()
      );
      
      // If no data found for the next month, return 404
      if (!nextMonthData) {
        res
          .status(404)
          .send(
            "No upcoming collection day found for the current or next month"
          );
        return;
      }
      
      nextCollection = findNextCollectionDay(nextMonthData);
    }
  }
  
  if (nextCollection) {
    const nextCollectionDate = moment(nextCollection.date, "DD-MM-YYYY");
    
    if (nextCollectionDate.isSame(today, "day")) {
      if (moment().isBefore(moment().hour(12), "hour")) {
        responseMessage = `Today is a collection day, for ${nextCollection.bin_collection}.`;
      } else {
        // Find the next collection day after today if today's collection has passed
        nextCollection = findNextCollectionDay({
          collection_days: currentMonthData.collection_days.filter((day) =>
            moment(day.date, "DD-MM-YYYY").isAfter(today)
          ),
        });
        
        if (nextCollection) {
          const nextCollectionDate = moment(nextCollection.date, "DD-MM-YYYY");
          responseMessage = `Today was collection day, the next collection is ${nextCollectionDate.format(
            "dddd, MMMM Do YYYY"
          )}, for ${nextCollection.bin_collection}.`;
        } else {
          responseMessage = `Today was collection day, and there are no more collection days in the current month.`;
        }
      }
    } else if (nextCollectionDate.isSame(today.clone().add(1, "days"), "day")) {
      responseMessage = `The next collection is tomorrow for, ${nextCollection.bin_collection}.`;
    } else {
      responseMessage = `The next collection day is on ${nextCollectionDate.format(
        "dddd, MMMM Do YYYY"
      )}, for ${nextCollection.bin_collection}. `;
    }
    
    res.json({
      message: responseMessage,
      date: nextCollectionDate.format("DD/MM/YYYY"),
      bins: nextCollection.bin_collection,
      start_time: nextCollection.start_time,
      end_time: nextCollection.end_time
    });
  } else {
    res.status(404).send("No upcoming collection day found.");
  }
});

app.listen(3000, () => console.log("Example app is listening on port 3000."));

module.exports = app;
