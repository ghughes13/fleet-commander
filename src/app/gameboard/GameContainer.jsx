"use client";
import { GameBoard } from "./Gameboard";

const GameContainer = () => {
  return (
    <div className="w-full h-full flex justify-center">
      <GameBoard />
    </div>
  );
};

export default GameContainer;
