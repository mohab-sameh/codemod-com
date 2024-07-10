import InsightsTabs from "./components/InsightsTabs";
import SecondaryHeader from "./components/SecondaryHeader";

const InsightsPage = () => {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <SecondaryHeader />
      <div className="flex w-full justify-start">
        <InsightsTabs
          items={[
            { id: "1", label: "All" },
            { id: "2", label: "Recommended" },
            { id: "3", label: "Featured" },
          ]}
        >
          <div>1</div>
          <div>2</div>
        </InsightsTabs>
      </div>
    </div>
  );
};

export default InsightsPage;
