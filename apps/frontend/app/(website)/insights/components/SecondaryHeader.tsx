"use client";
import Burger from "@/components/shared/Burger";
import Button from "@/components/shared/Button";
import Icon from "@/components/shared/Icon";
import { Separator } from "@studio/components/ui/separator";
import InsightsCounter from "./InsightsCounter";
import RepoSelector from "./RepoSelector";
import SearchBox from "./SearchBox";

const SecondaryHeader = () => {
  return (
    <div className="flex w-full py-[6px] px-[16px] items-center flex-row gap-2 flex-grow h-[40px] bg-emphasis-light dark:bg-emphasis-dark">
      <Burger />
      <Separator
        orientation="vertical"
        className="bg-border-light dark:bg-border-dark mx-[8px]"
      />
      <Button
        intent="secondary-icon-only"
        className="!px-[6px] !py-[6px]"
        onClick={() => {}}
      >
        <Icon name="filter" className="!w-[16px] !h-[16px]" />
      </Button>
      <SearchBox placeholder="Search for insights" onSearch={() => {}} />
      <Separator orientation="vertical" />
      <RepoSelector />
      <Button intent="secondary" icon="Settings">
        Display
      </Button>
      <Separator orientation="vertical" />
      <InsightsCounter />
    </div>
  );
};

export default SecondaryHeader;
