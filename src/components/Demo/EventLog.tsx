import { useRef, useEffect } from "react";
import type { EventLogEntry } from "@/demo/types";
import { DeviceTarget } from "@/demo/types";

interface Props {
  events: EventLogEntry[];
}

const TARGET_COLORS: Record<DeviceTarget, string> = {
  [DeviceTarget.DENON]: "#0d9488",
  [DeviceTarget.ROKU]: "#6d28d9",
  [DeviceTarget.HTPC]: "#2563eb",
  [DeviceTarget.TPLINK]: "#f59e0b",
};

function formatTime(date: Date): string {
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function EventLog({ events }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(events.length);

  useEffect(() => {
    if (events.length > prevLengthRef.current && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    prevLengthRef.current = events.length;
  }, [events.length]);

  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        Event Log
      </div>
      <div
        ref={containerRef}
        className="overflow-y-auto max-h-48 rounded bg-slate-950 border border-slate-800"
        style={{ fontFamily: "monospace" }}
      >
        {events.length === 0 ? (
          <div className="px-3 py-4 text-center text-slate-500 text-xs">
            No events yet. Try a remote control.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {events.map((entry) => (
                <tr
                  key={entry.id}
                  style={{ borderBottom: "1px solid #1e293b" }}
                >
                  {/* Timestamp */}
                  <td
                    style={{
                      padding: "4px 8px",
                      color: "#64748b",
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      verticalAlign: "middle",
                    }}
                  >
                    {formatTime(entry.timestamp)}
                  </td>

                  {/* Target badge */}
                  <td style={{ padding: "4px 4px", verticalAlign: "middle" }}>
                    <span
                      style={{
                        display: "inline-block",
                        background: TARGET_COLORS[entry.target],
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: "bold",
                        padding: "1px 5px",
                        borderRadius: 9999,
                        letterSpacing: "0.05em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.target}
                    </span>
                  </td>

                  {/* Command + detail */}
                  <td
                    style={{
                      padding: "4px 8px",
                      color: "#e2e8f0",
                      fontSize: 11,
                      verticalAlign: "middle",
                    }}
                  >
                    <span style={{ fontWeight: "bold" }}>{entry.command}</span>
                    {entry.detail && (
                      <span style={{ color: "#94a3b8", marginLeft: 6 }}>
                        {entry.detail}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
