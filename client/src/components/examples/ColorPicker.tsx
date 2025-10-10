import ColorPicker from "../ColorPicker";

export default function ColorPickerExample() {
  return (
    <div className="w-64">
      <ColorPicker
        onColorApply={(color) => {
          console.log("Color applied:", color);
        }}
      />
    </div>
  );
}
