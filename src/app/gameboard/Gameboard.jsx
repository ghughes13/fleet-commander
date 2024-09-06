"use client";
import { useEffect, useState, useRef } from "react";

function getWindowDimensions() {
  const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
  return {
    windowWidth,
    windowHeight,
  };
}

function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowDimensions;
}

export const GameBoard = () => {
  const canvasRef = useRef();

  const [gameExists, setGameExists] = useState(false);
  const { windowWidth, windowHeight } = useWindowDimensions();

  useEffect(() => {
    if (gameExists) return;
    const g = {
      parseGridProps: function (grid) {
        var a = {};
        a.width = grid.width || 64;
        a.height = grid.height || 16;
        a.cellSize = grid.cellSize || 64;
        a.xOffset = grid.xOffset === undefined ? 0 : grid.xOffset;
        a.yOffset = grid.yOffset === undefined ? 0 : grid.yOffset;
        a.bufferSize = grid.bufferSize === undefined ? 32 : grid.bufferSize;
        a.selectedCellIndex = grid.selectedCellIndex || -1;
        a.cells = [];
        return a;
      },
      createGridObject: function (w, h) {
        var a = g.parseGridProps({
          width: w,
          height: h,
        });
        return g.createClearCellGrid(a);
      },
      createClearCellGrid: function (grid) {
        var a = g.parseGridProps(grid);
        // create clean cells
        var i = 0,
          x,
          y,
          len = a.width * a.height;
        while (i < len) {
          a.cells.push({
            i: i,
            x: i % a.width,
            y: Math.floor(i / a.width),
            type: 0, // type index (0 = sand , 1-5 = grass, 6-10 = wood),
            worth: 0,
          });
          i += 1;
        }
        return a;
      },
      clampedOffsets: function (grid, canvas) {
        canvas = canvas || {
          width: 320,
          height: 120,
        };
        var w = grid.width * grid.cellSize,
          h = grid.height * grid.cellSize,
          bufferSize = grid.bufferSize,
          xMin = bufferSize,
          yMin = bufferSize,
          xMax = (w - canvas.width + bufferSize) * -1,
          yMax = (h - canvas.height + bufferSize) * -1,
          x = grid.xOffset,
          y = grid.yOffset;
        // rules
        x = x > xMin ? xMin : x;
        y = y > yMin ? yMin : y;
        x = x < xMax ? xMax : x;
        y = y < yMax ? yMax : y;
        // return offset values
        return {
          xOffset: x,
          yOffset: y,
        };
      },
      get: (grid, x, y) => {
        if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) {
          return {};
        }
        return grid.cells[y * grid.width + x];
      },
      getCellPositionFromCanvasPoint: (grid, x, y) => {
        return {
          x: Math.floor((x - grid.xOffset) / grid.cellSize),
          y: Math.floor((y - grid.yOffset) / grid.cellSize),
        };
      },
      getCellFromCanvasPoint: (grid, x, y) => {
        var pos = g.getCellPositionFromCanvasPoint(grid, x, y);
        return g.get(grid, pos.x, pos.y);
      },
      getPointerMovementDeltas: (grid, canvas, px, py) => {
        var cx = canvas.width / 2,
          cy = canvas.height / 2,
          a = Math.atan2(py - cy, px - cx),
          d = Math.sqrt(Math.pow(px - cx, 2) + Math.pow(py - cy, 2)),
          per,
          dMax = canvas.height / 2,
          delta;
        d = d >= dMax ? dMax : d;
        per = d / dMax;
        delta = (0.5 + per * 2.5) * -1;
        return {
          x: Math.cos(a) * delta,
          y: Math.sin(a) * delta,
        };
      },
    };

    const drawMap = function (grid, ctx, canvas) {
      var colors = ["blue", "green"],
        cellSize = grid.cellSize || 10,
        x,
        y,
        xOffset = grid.xOffset,
        yOffset = grid.yOffset;
      grid.cells.forEach(function (cell) {
        ctx.fillStyle = colors[cell.type] || "white";
        x = cell.x * cellSize + xOffset;
        y = cell.y * cellSize + yOffset;
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = "white";
        ctx.strokeRect(x, y, cellSize, cellSize);
      });

      if (grid.selectedCellIndex > -1) {
        ctx.strokeStyle = "red";
        var cell = grid.cells[grid.selectedCellIndex],
          x = cell.x * cellSize + xOffset,
          y = cell.y * cellSize + yOffset;
        ctx.strokeStyle = "red";
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    };

    const utils = {
      createCanvas: function () {
        const currentCanvas = canvasRef.current;
        currentCanvas.ctx = currentCanvas.getContext("2d");
        let ctx = currentCanvas.ctx;
        // set native width
        currentCanvas.width = currentCanvas.width || 320;
        currentCanvas.height = currentCanvas.height || 240;
        // translate by 0.5, 0.5
        ctx.translate(0.5, 0.5);
        // disable default action for onselectstart
        currentCanvas.onselectstart = function () {
          return false;
        };
        currentCanvas.style.imageRendering = "pixelated";
        ctx.imageSmoothingEnabled = false;
        // append canvas to container
        return currentCanvas;
      },
      getCanvasRelative: function (e) {
        var canvas = e.target,
          bx = canvas.getBoundingClientRect(),
          pos = {
            x:
              (e.changedTouches ? e.changedTouches[0].clientX : e.clientX) -
              bx.left,
            y:
              (e.changedTouches ? e.changedTouches[0].clientY : e.clientY) -
              bx.top,
            bx: bx,
          };
        // ajust for native canvas matrix size
        pos.x = Math.floor((pos.x / canvas.scrollWidth) * canvas.width);
        pos.y = Math.floor((pos.y / canvas.scrollHeight) * canvas.height);
        // prevent default
        e.preventDefault();
        return pos;
      },
    };

    // CANVAS
    var canvasObj = utils.createCanvas(),
      canvas = canvasRef.current,
      ctx = canvasRef.current.ctx;

    // scale
    var ratio = window.devicePixelRatio || 1;

    // CREATE GRID
    var grid = g.createGridObject(100, 100);
    grid.xOffset = 0;
    grid.yOffset = 0;

    var mousedown = false,
      gridDelta = {
        x: 0,
        y: 0,
      };

    // MAIN APP LOOP
    const loop = function () {
      requestAnimationFrame(loop);
      grid.xOffset += gridDelta.x * ratio;
      grid.yOffset += gridDelta.y * ratio;

      var offsets = g.clampedOffsets(grid, canvas, ratio);
      grid.xOffset = offsets.xOffset;
      grid.yOffset = offsets.yOffset;
      // fill black
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // draw map
      drawMap(grid, ctx, canvas, ratio);
      // draw ver
      ctx.fillStyle = "red";
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.font = "10px arial";
      ctx.fillText("v" + grid.ver, 5, canvas.height - 15);
    };
    loop();

    // EVENTS
    canvas.addEventListener("mousedown", function (e) {
      var pos = utils.getCanvasRelative(e);
      e.preventDefault();
      mousedown = true;
      var cell = g.getCellFromCanvasPoint(grid, pos.x / ratio, pos.y / ratio);
      if (cell.i === grid.selectedCellIndex) {
        grid.selectedCellIndex = -1;
      } else {
        if (cell.i >= 0) {
          grid.selectedCellIndex = cell.i;
        }
      }
    });
    canvas.addEventListener("mouseup", function (e) {
      e.preventDefault();
      mousedown = false;
      gridDelta.x = 0;
      gridDelta.y = 0;
    });
    canvas.addEventListener("mousemove", function (e) {
      var canvas = e.target,
        bx = canvas.getBoundingClientRect(),
        x = (e.clientX - bx.left) * ratio,
        y = (e.clientY - bx.top) * ratio,
        deltas = g.getPointerMovementDeltas(grid, canvas, x, y);
      if (mousedown) {
        gridDelta.x = deltas.x;
        gridDelta.y = deltas.y;
      }
    });

    return cleanUp();
  }, []);

  const cleanUp = () => {};

  console.log("render");
  return (
    <canvas ref={canvasRef} width={windowWidth} height={windowHeight}></canvas>
  );
};

export default GameBoard;
