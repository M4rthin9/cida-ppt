/** Original line illustrations for category navigation, never product photography. */
export function CraftMark({ kind, className = "" }: { kind: string; className?: string }) {
  return (
    <svg
      className={`v-craft-mark ${className}`}
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden="true"
    >
      {kind === "wreath" ? (
        <>
          <circle cx="100" cy="95" r="58" />
          <circle cx="100" cy="95" r="46" strokeDasharray="2 7" />
          {Array.from({ length: 12 }, (_, i) => (
            <g key={i} transform={`rotate(${i * 30} 100 95)`}>
              <path d="M100 43C80 25 85 12 100 22C115 12 120 25 100 43Z" />
              <path d="M100 43V25" />
            </g>
          ))}
          <path d="M89 148L76 183L100 173L124 183L111 148M100 151V172" />
        </>
      ) : kind === "material" ? (
        <>
          <path d="M32 71L100 35L169 71L100 108L32 71ZM32 71V129L100 165L169 129V71M100 108V165M49 80L118 44M67 90L137 55M85 100L155 64M44 95L85 117M44 110L85 132M44 125L85 147M118 112L156 91M118 127L156 106M118 142L156 121" />
          <path d="M66 39L79 32M125 164L141 156" strokeWidth="3" />
        </>
      ) : kind === "flower" ? (
        <>
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse
              key={i}
              cx="100"
              cy="62"
              rx="16"
              ry="35"
              transform={`rotate(${i * 45} 100 94)`}
            />
          ))}
          <circle cx="100" cy="94" r="15" />
          <circle cx="100" cy="94" r="8" strokeDasharray="1 3" />
          <path d="M100 130V188M100 166C77 168 61 151 63 143C81 140 96 151 100 166ZM100 179C126 174 138 160 135 151C117 151 103 164 100 179Z" />
        </>
      ) : kind === "textile" ? (
        <>
          <rect x="42" y="42" width="116" height="116" rx="2" />
          {Array.from({ length: 7 }, (_, i) => (
            <g key={i}>
              <path d={`M${55 + i * 15} 32V168M32 ${55 + i * 15}H168`} />
              <path d={`M${59 + i * 15} 43V157M43 ${59 + i * 15}H157`} opacity=".35" />
            </g>
          ))}
          <path d="M125 29L170 74M126 30L129 39M170 74L161 71" strokeWidth="2" />
          <path d="M170 74C186 99 181 120 164 136" strokeDasharray="3 4" />
        </>
      ) : (
        <>
          <circle cx="100" cy="100" r="62" />
          <path d="M100 38V162M38 100H162M56 56L144 144M56 144L144 56" />
          <circle cx="100" cy="100" r="28" />
        </>
      )}
    </svg>
  );
}
