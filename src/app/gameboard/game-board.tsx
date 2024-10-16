"use client";
import { useEffect, useState, useRef } from "react";
import { IGridProps, IHTMLCanvasElementExtension } from "./grid-board-types";

const getWindowDimensions = () => {
  const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
  return {
    windowWidth,
    windowHeight,
  };
};

const useWindowDimensions = () => {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowDimensions;
};

export const GameBoard = () => {
  const canvasRef = useRef<IHTMLCanvasElementExtension>(null);

  const [gameExists, setGameExists] = useState(false);
  const { windowWidth, windowHeight } = useWindowDimensions();

  useEffect(() => {
    if (gameExists) return;
    const g = {
      parseGridProps: function (grid: Partial<IGridProps>) {
        const a: IGridProps = {} as IGridProps;
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
      createGridObject: function (width: number, height: number) {
        var a = g.parseGridProps({
          width,
          height,
        });
        return g.createClearCellGrid(a);
      },
      createClearCellGrid: function (grid: Partial<IGridProps>) {
        var a = g.parseGridProps(grid);

        var i = 0,
          x,
          y,
          len = a.width * a.height;
        while (i < len) {
          a.cells.push({
            i: i,
            x: i % a.width,
            y: Math.floor(i / a.width),
            type: 0,
            worth: 0,
          });
          i += 1;
        }
        return a;
      },
      clampedOffsets: function (grid: IGridProps, canvas: HTMLCanvasElement) {
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

        x = x > xMin ? xMin : x;
        y = y > yMin ? yMin : y;
        x = x < xMax ? xMax : x;
        y = y < yMax ? yMax : y;

        return {
          xOffset: x,
          yOffset: y,
        };
      },
      get: (grid: IGridProps, xCoordinate: number, yCoordinate: number) => {
        if (xCoordinate < 0 || yCoordinate < 0 || xCoordinate >= grid.width || yCoordinate >= grid.height) {
          return {};
        }
        return grid.cells[yCoordinate * grid.width + xCoordinate];
      },
      getCellPositionFromCanvasPoint: (grid: IGridProps, xCoordinate: number, yCoordinate: number) => {
        return {
          x: Math.floor((xCoordinate - grid.xOffset) / grid.cellSize),
          y: Math.floor((yCoordinate - grid.yOffset) / grid.cellSize),
        };
      },
      getCellFromCanvasPoint: (grid: IGridProps, xCoordinate: number, yCoordinate: number) => {
        var pos = g.getCellPositionFromCanvasPoint(grid, xCoordinate, yCoordinate);
        return g.get(grid, pos.x, pos.y);
      },
      getPointerMovementDeltas: (grid: IGridProps, canvas: HTMLCanvasElement, px: number, py: number) => {
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

    const drawMap = function (grid: IGridProps, ctx: any, canvas: HTMLCanvasElement) {
      var colors = ["blue", "green"],
        cellSize = grid.cellSize || 10,
        x,
        y,
        xOffset = grid.xOffset,
        yOffset = grid.yOffset;

      grid.cells.forEach((cell) => {
        ctx.fillStyle = colors[cell.type] || "white";
        x = cell.x * cellSize + xOffset;
        y = cell.y * cellSize + yOffset;
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;

        ctx.strokeRect(x, y, cellSize, cellSize);
      });

      if (grid.selectedCellIndex > -1) {
        ctx.strokeStyle = "red";
        const cell = grid.cells[grid.selectedCellIndex];
        const x = cell.x * cellSize + xOffset;
        const y = cell.y * cellSize + yOffset;
        ctx.strokeStyle = "red";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    };

    const utils = {
      createCanvas: function () {
        const currentCanvas = canvasRef.current as IHTMLCanvasElementExtension;
        if (!currentCanvas) return;
        const context = currentCanvas.getContext("2d");
        if (!context) return;
        currentCanvas.ctx = context;
        let ctx = currentCanvas.ctx;

        currentCanvas.width = currentCanvas.width || 320;
        currentCanvas.height = currentCanvas.height || 240;

        ctx.translate(0.5, 0.5);

        currentCanvas.onselectstart = function () {
          return false;
        };
        currentCanvas.style.imageRendering = "pixelated";
        ctx.imageSmoothingEnabled = false;

        return currentCanvas;
      },
      getCanvasRelative: function (e: any) {
        const canvas = e.target;
        const bx = canvas.getBoundingClientRect();
        const pos = {
          x: (e.changedTouches ? e.changedTouches[0].clientX : e.clientX) - bx.left,
          y: (e.changedTouches ? e.changedTouches[0].clientY : e.clientY) - bx.top,
          bx: bx,
        };

        console.log(pos);

        pos.x = Math.floor((pos.x / canvas.scrollWidth) * canvas.width);
        pos.y = Math.floor((pos.y / canvas.scrollHeight) * canvas.height);

        e.preventDefault();
        return pos;
      },
    };

    utils.createCanvas();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvasRef?.current?.ctx;

    var ratio = window.devicePixelRatio || 1;

    var grid: IGridProps = g.createGridObject(100, 100);
    grid.xOffset = 1;
    grid.yOffset = 1;

    let mousedown = false;
    const gridDelta = {
      x: 0,
      y: 0,
    };

    const loop = function () {
      requestAnimationFrame(loop);
      grid.xOffset += gridDelta.x * ratio;
      grid.yOffset += gridDelta.y * ratio;

      var offsets = g.clampedOffsets(grid, canvas);
      grid.xOffset = offsets.xOffset;
      grid.yOffset = offsets.yOffset;

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawMap(grid, ctx, canvas);

      ctx.fillStyle = "red";
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.font = "10px arial";
      ctx.fillText("v" + grid, 5, canvas.height - 15);
    };
    loop();

    canvas.addEventListener("mousedown", function (e) {
      const pos = utils.getCanvasRelative(e);
      e.preventDefault();
      mousedown = true;
      const cell = g.getCellFromCanvasPoint(grid, pos.x / ratio, pos.y / ratio);
      console.log(cell);
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
      const canvas = e.target as HTMLCanvasElement;
      if (!canvas) return;
      const bx = canvas.getBoundingClientRect();
      const x = (e.clientX - bx.left) * ratio;
      const y = (e.clientY - bx.top) * ratio;
      const deltas = g.getPointerMovementDeltas(grid, canvas, x, y);
      if (mousedown) {
        gridDelta.x = deltas.x;
        gridDelta.y = deltas.y;
      }
    });

    return cleanUp();
  }, []);

  const cleanUp = () => {};

  return <canvas ref={canvasRef} width={windowWidth} height={windowHeight} className="fixed left-0 top-0"></canvas>;
};

export default GameBoard;
