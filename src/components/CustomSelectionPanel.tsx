import { useState } from "react";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";

interface Props {
  onApply: (count: number) => void;
  onSelectAll: () => void;
}

const CustomSelectionPanel = ({ onApply, onSelectAll }: Props) => {
  const [value, setValue] = useState<number | null>(null);

  const handleClick = () => {
    if (!value || value <= 0) {
      alert("Enter a valid number");
      return;
    }
    onApply(value);
  };

  return (
    <div className="flex flex-column gap-3 p-3">
      <span>Select N Rows</span>

      <InputNumber
        value={value}
        onValueChange={(e) => setValue(e.value ?? null)}
        placeholder="Enter count"
      />

      <Button label="Apply" onClick={handleClick} />

      <Button
        label="Select All"
        severity="secondary"
        onClick={onSelectAll}
      />
    </div>
  );
};

export default CustomSelectionPanel;