import Tabs, { type TabsProps } from "@/components/shared/Tabs";

const InsightsTabs = ({ items, children }: TabsProps) => {
  return (
    <Tabs listClassName="h-[28px]" items={items}>
      {children}
    </Tabs>
  );
};

export default InsightsTabs;
