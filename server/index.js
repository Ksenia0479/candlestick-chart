const express = require("express");
const axios = require("axios");
const cors = require("cors");
const PORT = process.env.PORT || 4000;

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

app.get("/url", async (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  const urlRUB = `${process.env.CHART_URL}?symbol=29&resolution=5&from=${from}&to=${to}`;
  const { data } = await axios.get(urlRUB);
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT} port`);
});
