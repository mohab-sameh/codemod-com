"use client";
import Input from "@/components/shared/Input";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

type Props = {
  placeholder?: string;
  onSearch: (key: string, value: string) => void;
};

const SearchBox = ({ placeholder, onSearch }: Props) => {
  const inputWrapperRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleFocus(event: KeyboardEvent) {
      const input = inputWrapperRef.current?.querySelector("input");
      if (event.metaKey && event.key === "k") {
        event.preventDefault();
        input?.focus();
      }
    }

    window.addEventListener("keydown", handleFocus);
    return () => {
      window.removeEventListener("keydown", handleFocus);
    };
  }, [router]);

  const [searchInput, setSearchInput] = useState("");
  return (
    <div className="flex w-full flex-1 items-center gap-3">
      <div
        ref={inputWrapperRef}
        onClick={() => {
          const input = inputWrapperRef.current?.querySelector("input");
          input?.focus();
        }}
        className="w-full"
      >
        <Input
          // onChange={(e) => handleSearch(e.target.value)}
          onChange={() => {}}
          placeholder={placeholder}
          // icon={loading ? "codemod-dot-pulse" : "search"}
          icon={"codemod-dot-pulse"}
          command={searchInput ? undefined : "⌘K"}
          onClear={() => {
            setSearchInput("");
          }}
          value={searchInput}
          inputClassName="placeholder:text-secondary-light dark:placeholder:text-secondary-dark"
          iconClassName="text-secondary-light dark:text-secondary-dark w-5 h-5"
        />
      </div>
    </div>
  );
};

export default SearchBox;
