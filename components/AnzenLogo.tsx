export function AnzenLogo({ size = 35 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <path id="petalFlat" d="M -30, -100 C -70,-220 -30,-310 0,-320 C 30,-310 70,-220 30,-100 Z" />
      </defs>
      <g transform="translate(512, 512)">
        <g fill="#D8F601">
          {Array.from({ length: 12 }, (_, i) => (
            <use key={i} href="#petalFlat" transform={`rotate(${i * 30})`} />
          ))}
        </g>
        <circle cx="0" cy="0" r="85" fill="#A8D102" />
        <circle cx="0" cy="0" r="10" fill="#88A901" />
      </g>
    </svg>
  );
}
