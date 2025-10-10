import FormulaSection from "../FormulaSection";

export default function FormulaSectionExample() {
  return (
    <div className="w-80">
      <FormulaSection
        onFormulaApply={(formula) => {
          console.log("Formula applied:", formula);
        }}
      />
    </div>
  );
}
