import * as React from "react";
import type { MetricData } from "../../pdfReportTypes.js";
import { formatNumber, safeToFixed, truncateString } from "./utils.js";

interface TopListItemProps {
  value: string;
  percentage: number | null;
  count: number;
  barWidth: number;
  favicon?: string;
}

const TopListItem = ({ value, percentage, count, barWidth, favicon }: TopListItemProps) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      padding: "4px 8px",
      marginBottom: "4px",
      borderRadius: "6px",
      position: "relative",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: `${barWidth}%`,
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        borderRadius: "6px",
        zIndex: 0,
      }}
    />
    <div style={{ display: "flex", alignItems: "center", flex: "1", minWidth: "0", position: "relative", zIndex: 1 }}>
      {favicon && (
        <img src={favicon} alt="" width="16" height="16" style={{ marginRight: "8px", borderRadius: "2px" }} />
      )}
      <span
        style={{
          color: "#111827",
          fontSize: "13px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={value}
      >
        {truncateString(value, 27)}
      </span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "12px" }}>
      <span style={{ color: "#6b7280", fontSize: "12px", width: "30px", textAlign: "right" }}>
        {safeToFixed(percentage, 1)}%
      </span>
      <span style={{ color: "#111827", fontSize: "13px", fontWeight: "500", width: "38px", textAlign: "right" }}>
        {formatNumber(count)}
      </span>
    </div>
  </div>
);

export interface TopListSectionProps {
  title: string;
  items: MetricData[];
  renderLabel: (item: MetricData) => string;
  showFavicon?: boolean;
}

export const TopListSection = ({ title, items, renderLabel, showFavicon }: TopListSectionProps) => {
  if (items.length === 0) return null;

  const ratio = items[0]?.percentage ? 100 / items[0].percentage : 1;

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "16px",
        flex: "1",
      }}
    >
      <div style={{ color: "#111827", fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>{title}</div>
      {items.map((item, index) => {
        const barWidth = (item.percentage ?? 0) * ratio;
        const favicon = showFavicon ? `https://www.google.com/s2/favicons?domain=${item.value}&sz=16` : undefined;

        return (
          <TopListItem
            key={index}
            value={renderLabel(item)}
            percentage={item.percentage}
            count={item.count}
            barWidth={barWidth}
            favicon={favicon}
          />
        );
      })}
    </div>
  );
};
