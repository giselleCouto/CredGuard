import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RiskScoreProps {
  score: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

/**
 * Componente de Score de Risco com cores baseadas no nível
 * R1-R3: Verde (Baixo Risco)
 * R4-R6: Amarelo (Médio Risco)
 * R7-R10: Vermelho (Alto Risco)
 */
export default function RiskScore({ score, size = "md", showLabel = true, className }: RiskScoreProps) {
  // Extrair número do score (ex: "R7" -> 7)
  const scoreNumber = parseInt(score.replace(/[^0-9]/g, ""));
  
  // Determinar nível de risco e cores
  const getRiskLevel = () => {
    if (scoreNumber >= 1 && scoreNumber <= 3) {
      return {
        level: "Baixo Risco",
        color: "bg-green-100 text-green-800 border-green-300",
        dotColor: "bg-green-600",
        description: "Cliente com excelente histórico de crédito"
      };
    } else if (scoreNumber >= 4 && scoreNumber <= 6) {
      return {
        level: "Médio Risco",
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        dotColor: "bg-yellow-600",
        description: "Cliente com histórico moderado, requer análise"
      };
    } else if (scoreNumber >= 7 && scoreNumber <= 10) {
      return {
        level: "Alto Risco",
        color: "bg-red-100 text-red-800 border-red-300",
        dotColor: "bg-red-600",
        description: "Cliente com histórico de inadimplência"
      };
    }
    
    // Fallback para scores inválidos
    return {
      level: "Desconhecido",
      color: "bg-gray-100 text-gray-800 border-gray-300",
      dotColor: "bg-gray-600",
      description: "Score não reconhecido"
    };
  };

  const risk = getRiskLevel();

  // Tamanhos
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5"
  };

  const dotSizes = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5"
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Badge 
        variant="outline" 
        className={cn(
          risk.color,
          sizeClasses[size],
          "font-semibold border"
        )}
      >
        <span className={cn("rounded-full mr-1.5", risk.dotColor, dotSizes[size])} />
        {score}
      </Badge>
      
      {showLabel && (
        <span className={cn(
          "font-medium",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          size === "lg" && "text-base"
        )}>
          {risk.level}
        </span>
      )}
    </div>
  );
}

/**
 * Componente de Score com Tooltip detalhado
 */
export function RiskScoreWithTooltip({ score, className }: { score: string; className?: string }) {
  const scoreNumber = parseInt(score.replace(/[^0-9]/g, ""));
  
  const getRiskDetails = () => {
    if (scoreNumber >= 1 && scoreNumber <= 3) {
      return {
        level: "Baixo Risco",
        color: "text-green-600",
        icon: "✓",
        recommendation: "Aprovação recomendada com limite padrão"
      };
    } else if (scoreNumber >= 4 && scoreNumber <= 6) {
      return {
        level: "Médio Risco",
        color: "text-yellow-600",
        icon: "⚠",
        recommendation: "Aprovação com limite reduzido e análise adicional"
      };
    } else {
      return {
        level: "Alto Risco",
        color: "text-red-600",
        icon: "✕",
        recommendation: "Rejeição recomendada ou análise manual detalhada"
      };
    }
  };

  const details = getRiskDetails();

  return (
    <div className={cn("group relative", className)}>
      <RiskScore score={score} showLabel={false} />
      
      {/* Tooltip */}
      <div className="invisible group-hover:visible absolute z-10 w-64 p-3 bg-popover text-popover-foreground border rounded-lg shadow-lg -top-2 left-full ml-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{details.icon}</span>
          <span className={cn("font-semibold", details.color)}>{details.level}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {details.recommendation}
        </p>
        <div className="mt-2 pt-2 border-t text-xs">
          <span className="font-mono font-semibold">{score}</span>
          <span className="text-muted-foreground ml-1">
            (Escala R1-R10)
          </span>
        </div>
      </div>
    </div>
  );
}
