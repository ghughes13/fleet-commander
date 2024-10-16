"use client";
import DropDownMenu from "@/components/DropDownMenu";
import { GameBoard } from "./game-board";
import NoSsr from "./NoSsr";

const GameContainer = () => {
  return (
    <NoSsr>
      <GameBoard />
      <DropDownMenu />
    </NoSsr>
  );
};

export default GameContainer;
