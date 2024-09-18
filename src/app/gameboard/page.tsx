import GameContainer from "./GameContainer";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const GamePage = async () => {
  const session = await auth();

  if (!session?.user) redirect("/");

  return (
    <div>
      <h1>{session?.user?.name}</h1>
      <GameContainer />
    </div>
  );
};

export default GamePage;
