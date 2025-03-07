import { Menu } from "./menu";

const main = async (): Promise<void> => {
  let choice: string = "";
  while (choice !== "exit") {
    choice = (await Menu()) || "";
    console.log(choice);
  }
  console.log("Thank you for using GIC Banking App");
};

main();
