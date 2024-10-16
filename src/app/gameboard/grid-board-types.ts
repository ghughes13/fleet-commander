export interface IGridProps {
  width: number;
  height: number;
  cellSize: number;
  xOffset: number;
  yOffset: number;
  bufferSize: number;
  selectedCellIndex: number;
  cells: any[];
}

export interface IHTMLCanvasElementExtension extends HTMLCanvasElement {
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
}
