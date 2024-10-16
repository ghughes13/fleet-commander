import { useState } from "react";

const DropDownMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`fixed transition-all left-0 right-0 mx-auto text-center ${isOpen ? "top-0" : "-top-6"} `}>
      <div className="bg-black w-">
        <a>Test</a>
      </div>

      <button onClick={() => setIsOpen(!isOpen)} className={`${isOpen ? "-rotate-90" : "rotate-90"}`}>
        &gt;
      </button>
    </div>
  );
};

export default DropDownMenu;
