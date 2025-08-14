import { useState } from "react";

export default function ExpandableText({ children, maxLength = 100, onExpand }) {
  const [expanded, setExpanded] = useState(false);

  // children이 string이 아닐 경우 처리
  const text = typeof children === "string" ? children : "";

  if (text.length <= maxLength) {
    return <span>{children}</span>;
  }

  return (
    <span>
      {expanded ? text : text.slice(0, maxLength) + "... "}
      <button
        className="px-3 py-1 rounded-full font-semibold text-navy-600 bg-navy-50 hover:bg-navy-100 transition-colors duration-150 cursor-pointer ml-2 mt-1"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((prev) => !prev);
          if (!expanded && onExpand) onExpand();
        }}
      >
        {expanded ? "접기" : "더보기"}
      </button>
    </span>
  );
} 