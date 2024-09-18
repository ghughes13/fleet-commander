"use client";
import { GameBoard } from "./game-board";
import NoSsr from "./NoSsr";

const GameContainer = () => {
  return (
    <NoSsr>
      {/* <div>HERE</div> */}
      <GameBoard />
    </NoSsr>
  );
};

export default GameContainer;
