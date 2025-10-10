import BulkValueSection from "../BulkValueSection";

export default function BulkValueSectionExample() {
  return (
    <div className="w-80">
      <BulkValueSection
        onBulkAdd={(values, separator) => {
          console.log("Bulk values added:", values, "with separator:", separator);
        }}
      />
    </div>
  );
}
