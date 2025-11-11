interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = "", size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Círculo externo com gradiente */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#3b82f6", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#1d4ed8", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Círculo de fundo */}
      <circle cx="100" cy="100" r="95" fill="url(#logoGradient)" />
      
      {/* Letra "B" estilizada representando Behavior */}
      <path
        d="M 60 60 L 60 140 L 110 140 C 125 140 135 130 135 115 C 135 105 130 98 122 95 C 128 92 132 85 132 77 C 132 62 122 60 107 60 Z M 75 72 L 105 72 C 115 72 118 75 118 82 C 118 89 115 92 105 92 L 75 92 Z M 75 104 L 108 104 C 118 104 121 107 121 114 C 121 121 118 128 108 128 L 75 128 Z"
        fill="white"
      />
      
      {/* Elementos decorativos - nós de rede neural */}
      <circle cx="145" cy="75" r="8" fill="white" opacity="0.8" />
      <circle cx="155" cy="100" r="6" fill="white" opacity="0.6" />
      <circle cx="145" cy="125" r="7" fill="white" opacity="0.7" />
      
      {/* Linhas conectando os nós */}
      <line x1="110" y1="80" x2="137" y2="75" stroke="white" strokeWidth="2" opacity="0.5" />
      <line x1="110" y1="100" x2="149" y2="100" stroke="white" strokeWidth="2" opacity="0.4" />
      <line x1="110" y1="120" x2="138" y2="125" stroke="white" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}
