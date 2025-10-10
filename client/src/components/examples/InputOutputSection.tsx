import { useState } from "react";
import InputOutputSection from "../InputOutputSection";

export default function InputOutputSectionExample() {
  const [inputValue, setInputValue] = useState("");
  const [outputValue, setOutputValue] = useState("");

  return (
    <div className="w-80">
      <InputOutputSection
        inputValue={inputValue}
        outputValue={outputValue}
        onInputChange={setInputValue}
        onOutputChange={setOutputValue}
        onShowInput={() => {
          setInputValue("A1, B2, C3");
          console.log("Show input clicked");
        }}
        onShowOutput={() => {
          setOutputValue("A1, B2, C3");
          console.log("Show output clicked");
        }}
      />
    </div>
  );
}
