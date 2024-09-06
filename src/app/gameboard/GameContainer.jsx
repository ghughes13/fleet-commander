"use client";
import { GameBoard } from "./Gameboard";
import NoSsr from "./NoSsr";

const GameContainer = () => {
  return (
    <NoSsr>
      <GameBoard />
    </NoSsr>
  );
};

export default GameContainer;
