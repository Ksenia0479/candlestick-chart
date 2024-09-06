import { useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  function getCurrencyTracker(parsedRUBInfo) {
    const lineWidthAlign = 0.5;
    let stepY;
    const x = 0;
    const y = 0;
    let delta = 0;
    let scale = 1;
    let rectangleWidth = 30;
    let rectangleSpace = 20;
    let startRatePoint = 0;
    let deltaIntervalLeft = 0;
    let deltaIntervalRight = 0;
    let shiftX = 0;
    const canvasChartGrid = document.getElementById("chart_grid");
    function drawRUBCurrencyPage() {
      const canvasChartContainer = document.getElementById(
        "chart-markup-table-pane"
      );
      const ctx = canvasChartGrid.getContext("2d");
      canvasChartGrid.style.cursor = "crosshair";
      canvasChartGrid.width = canvasChartContainer.clientWidth;
      canvasChartGrid.height = 750;
      drawRateChart(ctx, canvasChartGrid);

      canvasChartGrid.addEventListener("mousemove", drawMouseTrackerLines);
      function drawMouseTrackerLines(event) {
        const lineX =
          event.clientX -
          canvasChartGrid.getBoundingClientRect().left -
          canvasChartGrid.clientLeft;
        const lineY =
          event.clientY -
          canvasChartGrid.getBoundingClientRect().top -
          canvasChartGrid.clientTop;
        ctx.clearRect(x, y, canvasChartGrid.width, canvasChartGrid.height);
        drawRateChart(ctx, canvasChartGrid);
        drawMouseDashedLines(ctx, lineX, lineY);
      }
      canvasChartGrid.addEventListener("mousedown", getStartDeltaX);
      function getStartDeltaX(event) {
        canvasChartGrid.style.cursor = "grabbing";
        const startDeltaX =
          event.clientX -
          canvasChartGrid.getBoundingClientRect().left +
          window.scrollX -
          delta -
          canvasChartGrid.clientLeft;
        canvasChartGrid.addEventListener("mousemove", getEndDeltaX);
        function getEndDeltaX(event) {
          const endDeltaX =
            event.clientX -
            canvasChartGrid.getBoundingClientRect().left +
            window.scrollX;
          delta = endDeltaX - startDeltaX;
        }
        canvasChartGrid.addEventListener("mouseup", fixChartPosition);
        function fixChartPosition() {
          canvasChartGrid.style.cursor = "crosshair";
          canvasChartGrid.removeEventListener("mousemove", getEndDeltaX);
        }
      }
      canvasChartGrid.addEventListener("wheel", getScaleY);
      function getScaleY(event) {
        const scaleStep = 0.0125;
        const maxScalePoint = 0.2;
        const dX = event.wheelDelta;
        if (dX < 0 && scale > maxScalePoint) {
          scale -= scaleStep;
        } else if (scale < 1 && dX > 0) {
          scale += scaleStep;
        }
        rectangleWidth = Math.round(30 * scale);
        rectangleSpace = Math.round(20 * scale);

        drawRateChart(ctx, canvasChartGrid);
      }
    }
    function drawMouseDashedLines(ctx, mouseCoordinateX, mouseCoordinateY) {
      let lineX;
      let rectangleInterval = rectangleSpace + rectangleWidth;
      const lineSpace = Number(rectangleSpace / 2 / rectangleInterval).toFixed(
        2
      );
      const positionX = Number(
        (canvasChartGrid.width - mouseCoordinateX + deltaIntervalLeft) /
          Number(rectangleInterval * scale).toFixed(2)
      ).toFixed(2);

      if (positionX % 1 >= lineSpace) {
        lineX =
          canvasChartGrid.width -
          Math.round(
            ((rectangleWidth + rectangleSpace) * Math.ceil(positionX) -
              rectangleWidth / 2) *
              scale
          ) +
          deltaIntervalLeft;
      } else {
        lineX =
          canvasChartGrid.width -
          Math.round(
            ((rectangleWidth + rectangleSpace) * Math.floor(positionX) -
              rectangleWidth / 2) *
              scale
          ) +
          deltaIntervalLeft;
      }

      ctx.strokeStyle = "#A9A9A9";
      ctx.setLineDash([4, 2]);
      ctx.beginPath();

      // vertical line drawing
      ctx.moveTo(Math.round(lineX) + lineWidthAlign, y);
      ctx.lineTo(Math.round(lineX) + lineWidthAlign, canvasChartGrid.height);

      // horizontal line drawing
      ctx.moveTo(x, lineWidthAlign + mouseCoordinateY);
      ctx.lineTo(canvasChartGrid.width, lineWidthAlign + mouseCoordinateY);
      ctx.stroke();
    }
    function drawGrid(ctx, lineCapacity) {
      const timeTradingInterval = 5;
      const totalTime = 60;
      let rectangleInterval = rectangleWidth + rectangleSpace;

      ctx.strokeStyle = "#e5e5e5";
      ctx.setLineDash([0]);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(x, y, canvasChartGrid.width, canvasChartGrid.height);

      const factLineCapacity =
        lineCapacity /
        Math.floor((lineCapacity * timeTradingInterval) / totalTime); // 14 points, scale = 1
      const lineInterval =
        ((rectangleWidth + rectangleSpace) * lineCapacity) / factLineCapacity; // 100px, scale = 1

      for (let j = Math.floor(factLineCapacity); j >= 0; j--) {
        const xPosition = getXPosition(
          canvasChartGrid,
          rectangleInterval,
          rectangleWidth
        );
        ctx.beginPath();
        ctx.moveTo(xPosition, y);
        ctx.lineTo(xPosition, canvasChartGrid.height);
        ctx.stroke();
        rectangleInterval += lineInterval;
      }
      for (let j = stepY; j <= canvasChartGrid.height; j += stepY) {
        ctx.beginPath();
        ctx.moveTo(x, lineWidthAlign + j);
        ctx.lineTo(canvasChartGrid.width, lineWidthAlign + j);
        ctx.stroke();
      }
    }
    function drawRateChart(ctx, canvasElem) {
      let rectangleInterval = rectangleWidth + rectangleSpace;
      const rectangleCapacity = Math.ceil(
        canvasElem.clientWidth / (rectangleWidth + rectangleSpace) / scale
      );
      const deltaCheckPoint = Math.round(
        Number(rectangleWidth * scale + rectangleSpace * scale).toFixed(2)
      );
      const scaleCheckPoint = parsedRUBInfo["o"].length - rectangleCapacity;

      deltaIntervalLeft = delta - shiftX;
      deltaIntervalRight = shiftX - delta;

      while (
        deltaIntervalLeft >= deltaCheckPoint &&
        startRatePoint < scaleCheckPoint
      ) {
        startRatePoint++;
        shiftX += Math.round(rectangleInterval * scale);
        deltaIntervalLeft = delta - shiftX;
      }
      while (deltaIntervalRight > 0 && startRatePoint > 0) {
        startRatePoint--;
        shiftX -= Math.round(rectangleInterval * scale);
        deltaIntervalRight = shiftX - delta;
      }

      const sumTotalRectangles =
        parsedRUBInfo["o"].length - startRatePoint - rectangleCapacity;

      const parsedRUBInfoArrayOpen = []; // Open Rate array
      getRateData(
        parsedRUBInfo["o"],
        parsedRUBInfoArrayOpen,
        rectangleCapacity,
        sumTotalRectangles
      );
      const parsedRUBInfoArrayClose = []; // Close Rate array
      getRateData(
        parsedRUBInfo["c"],
        parsedRUBInfoArrayClose,
        rectangleCapacity,
        sumTotalRectangles
      );
      const parsedRUBInfoArrayLow = []; // Low Rate array
      getRateData(
        parsedRUBInfo["l"],
        parsedRUBInfoArrayLow,
        rectangleCapacity,
        sumTotalRectangles
      );
      const parsedRUBInfoArrayHigh = []; // High Rate array
      getRateData(
        parsedRUBInfo["h"],
        parsedRUBInfoArrayHigh,
        rectangleCapacity,
        sumTotalRectangles
      );

      const totalRateData = parsedRUBInfoArrayOpen
        .concat(parsedRUBInfoArrayClose)
        .concat(parsedRUBInfoArrayLow)
        .concat(parsedRUBInfoArrayHigh);

      const maxRateArray = Math.max.apply(Math, totalRateData);
      const minRateArray = Math.min.apply(Math, totalRateData);

      const deltaRate = maxRateArray - minRateArray;

      drawRateMarkupAxis(totalRateData);
      drawTradingTimeAxis(rectangleCapacity, sumTotalRectangles);
      drawGrid(ctx, rectangleCapacity);

      for (let j = rectangleCapacity - 1; j >= 0; j--) {
        const openRate = parsedRUBInfoArrayOpen[j];
        const closeRate = parsedRUBInfoArrayClose[j];

        const deltaCloseOpenRate = Math.abs(openRate - closeRate);

        const lowRate = parsedRUBInfoArrayLow[j];
        const highRate = parsedRUBInfoArrayHigh[j];

        const deltaOpenMinRate = openRate - minRateArray;
        const deltaCloseMinRate = closeRate - minRateArray;

        function defineRectangleCoordinates(deltaMinRate, rectangleColor) {
          ctx.setLineDash([0]);
          ctx.strokeStyle = "#808080";

          const rectX = Math.round(
            canvasElem.width -
              Math.round(rectangleInterval * scale) +
              delta -
              shiftX
          );
          const rectY = Math.round(
            canvasElem.height - (deltaMinRate * canvasElem.height) / deltaRate
          );
          const rectW = Math.round(rectangleWidth * scale);
          const rectH = Math.round(
            (canvasElem.height * deltaCloseOpenRate) / deltaRate
          );

          const wickX = getXPosition(
            canvasElem,
            rectangleInterval,
            rectangleWidth
          );
          const wickY = Math.round(
            canvasElem.height -
              (canvasElem.height * (highRate - minRateArray)) / deltaRate
          );
          const wickH = Math.round(
            canvasElem.height -
              (canvasElem.height * (lowRate - minRateArray)) / deltaRate
          );

          ctx.beginPath();
          ctx.moveTo(wickX, wickY);
          ctx.lineTo(wickX, wickH);
          ctx.stroke();

          ctx.fillStyle = rectangleColor;
          ctx.fillRect(rectX, rectY, rectW, rectH);

          // to improve code!!!
          const scaleMAX = 0.2375;
          if (scale > scaleMAX) {
            ctx.strokeStyle = "#000";
            ctx.strokeRect(
              rectX + lineWidthAlign,
              rectY + lineWidthAlign,
              rectW,
              rectH
            );
          }
        }

        if (deltaCloseMinRate > deltaOpenMinRate) {
          defineRectangleCoordinates(deltaCloseMinRate, "#00FF00");
        } else {
          defineRectangleCoordinates(deltaOpenMinRate, "#FF0000");
        }
        rectangleInterval += rectangleSpace + rectangleWidth;
      }
    }
    function getRateData(rates, rateData, capacity, total) {
      let rectangleCapacity = capacity;
      let sumTotalRectangles = total;
      while (rectangleCapacity) {
        rateData.push(rates[sumTotalRectangles]);
        sumTotalRectangles++;
        rectangleCapacity--;
      }
    }
    function drawRateMarkupAxis(rateMaxMinData) {
      const canvasChartAxisY = document.getElementById(
        "chart_markup_price_axis"
      );
      const ctx = canvasChartAxisY.getContext("2d");
      canvasChartAxisY.height = canvasChartGrid.height;
      canvasChartAxisY.width = 50;
      drawPrices(ctx, canvasChartAxisY, rateMaxMinData);
    }
    function drawPrices(ctx, canvasElem, rateMaxMinData) {
      const maxScale = 0.135;
      let rateInterval = 0;
      const ratePositionX = canvasElem.width * 0.125;
      const lineLength = canvasElem.width * 0.05;

      let maxRate = Math.max.apply(Math, rateMaxMinData);
      const minRate = Math.min.apply(Math, rateMaxMinData);

      const deltaRate = maxRate - minRate;

      if (deltaRate < maxScale) {
        rateInterval = Number(
          ((canvasElem.height / 100) * Number(deltaRate).toFixed(3)) / 100
        ).toFixed(3);
      } else {
        rateInterval = Math.floor((canvasElem.height / 100) * deltaRate) / 100;
      }

      const totalRatePoints = deltaRate / rateInterval;
      stepY = Math.round(canvasElem.height / totalRatePoints);

      ctx.strokeStyle = "#606060";
      for (let j = 0; j < canvasElem.height; j += stepY) {
        ctx.beginPath();
        ctx.moveTo(x, j + lineWidthAlign);
        ctx.lineTo(lineLength + lineWidthAlign, j + lineWidthAlign);
        ctx.stroke();

        ctx.fillStyle = "#606060";
        ctx.textAlign = "medium";
        ctx.font = "11px Arial";
        ctx.fillText(maxRate.toPrecision(5), ratePositionX, j + 5);
        maxRate -= rateInterval;
      }
    }
    function drawTradingTimeAxis(tradingTimeCapacity, totalTradingTimePoints) {
      const canvasChartAxisX = document.getElementById(
        "chart_markup_date_axis"
      );
      const ctx = canvasChartAxisX.getContext("2d");
      canvasChartAxisX.width = canvasChartGrid.width;
      canvasChartAxisX.height = 20;
      drawTime(
        ctx,
        canvasChartAxisX,
        tradingTimeCapacity,
        totalTradingTimePoints
      );
    }
    function drawTime(
      ctx,
      canvasElem,
      tradingTimeCapacity,
      totalTradingTimePoints
    ) {
      const tradingTimeInterval = 5;
      const totalTime = 60;
      let rectangleInterval = rectangleWidth + rectangleSpace;
      const timePositionY = canvasElem.height * 0.7;
      const lineLength = canvasElem.height * 0.1;
      ctx.strokeStyle = "#606060";
      ctx.fillStyle = "#505050";

      // Get time data based on the rectangleCapacity on clientWidth;
      const parsedRUBInfoTime = [];
      getRateData(
        parsedRUBInfo["t"],
        parsedRUBInfoTime,
        tradingTimeCapacity,
        totalTradingTimePoints
      );

      const timePointStep = Math.floor(
        (tradingTimeCapacity * tradingTimeInterval) / totalTime
      ); // 2
      const factTradingTimeCapacity = tradingTimeCapacity / timePointStep; // 14.5 points
      const timeTradingPointsInterval =
        ((rectangleWidth + rectangleSpace) * tradingTimeCapacity) /
        factTradingTimeCapacity; // 100px
      let i = 0;

      for (let j = Math.floor(factTradingTimeCapacity); j >= 0; j--) {
        const timePositionX = getXPosition(
          canvasElem,
          rectangleInterval,
          rectangleWidth
        );

        ctx.beginPath();
        ctx.moveTo(timePositionX, y);
        ctx.lineTo(timePositionX, lineLength + lineWidthAlign);
        ctx.stroke();

        const time = new Date(
          parsedRUBInfoTime[Math.floor(tradingTimeCapacity - 1 - i)] * 1000
        );
        const hours = time.getHours().pad(2);
        const minutes = time.getMinutes().pad(2);
        let tradingTime = `${hours}:${minutes}`;

        ctx.font = "11px Arial";
        if (hours === "00" && minutes === "00") {
          ctx.font = "bold 12px Arial";
          const monthName = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const month = monthName[time.getMonth()];
          const day = time.getDate().pad(2);
          tradingTime = `${month}, ${day}`;
        }
        ctx.fillText(tradingTime, timePositionX, timePositionY);
        i += timePointStep;
        rectangleInterval += timeTradingPointsInterval;
      }
    }
    function getXPosition(canvasElem, rectangleInterval, rectangleWidth) {
      const xPosition =
        lineWidthAlign +
        canvasElem.width -
        Math.round((rectangleInterval - rectangleWidth / 2) * scale) +
        delta -
        shiftX;
      return xPosition;
    }
    window.addEventListener("resize", resizeChart);
    function resizeChart(event) {
      canvasChartGrid.width = event.clientWidth;
      drawRUBCurrencyPage();
    }
    Number.prototype.pad = function (size) {
      let s = String(this);
      while (s.length < (size || 2)) {
        s = "0" + s;
      }
      return s;
    };
    drawRUBCurrencyPage();
  }

  useEffect(() => {
    const loadRUBData = async () => {
      // Create new object XMLHttpRequest
      const dateInterval = 430000;
      const currentDate = Math.floor(Date.now() / 1000);
      const startDate = currentDate - dateInterval;

      /*Object.defineProperty(document, "referrer", {get : function(){ return "my new referrer"; }});*/

      const { data } = await axios.get(
        `https://candlestick-chart-5x57.vercel.app/url`,
        {
          params: {
            from: startDate,
            to: currentDate,
          },
        }
      );

      getCurrencyTracker(data);
    };
    loadRUBData();
  }, []);

  return (
    <div>
      <div id="chart-markup-table-pane">
        <canvas id="chart_grid"></canvas>
        <canvas id="chart_markup_date_axis"></canvas>
      </div>
      <div id="chart-markup-table-price-axis">
        <canvas id="chart_markup_price_axis"></canvas>
      </div>
    </div>
  );
}

export default App;
