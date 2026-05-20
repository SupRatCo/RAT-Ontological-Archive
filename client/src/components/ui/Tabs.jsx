export default function Tabs({ tabs, value, onChange }) {
  return (
    <div className="roa-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`roa-tab ${value === tab.value ? "active" : ""}`}
          onClick={() => onChange(tab.value)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
