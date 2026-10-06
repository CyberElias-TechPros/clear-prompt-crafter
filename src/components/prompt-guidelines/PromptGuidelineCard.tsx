import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertTriangle, Bug, Check, CheckCircle2, HelpCircle, Info } from "lucide-react";

interface GuidelineProps {
  title: string;
  description: string;
  content: string[];
  variant?: "default" | "tip" | "warning" | "success" | "debug";
}

const variantStyles = {
  default: { icon: HelpCircle, iconClass: "bg-[#f1f0f6] text-[#747586]", bulletClass: "text-[#8b8c99]" },
  tip: { icon: Info, iconClass: "bg-[#efedff] text-[#6252d1]", bulletClass: "text-[#7065ce]" },
  warning: { icon: AlertTriangle, iconClass: "bg-amber-50 text-amber-600", bulletClass: "text-amber-500" },
  success: { icon: CheckCircle2, iconClass: "bg-emerald-50 text-emerald-600", bulletClass: "text-emerald-500" },
  debug: { icon: Bug, iconClass: "bg-blue-50 text-blue-600", bulletClass: "text-blue-500" },
};

const PromptGuidelineCard: React.FC<GuidelineProps> = ({ title, description, content, variant = "default" }) => {
  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <Card className="h-full border-border/75 bg-white/90 shadow-[0_4px_16px_rgba(30,30,48,0.03)] dark:bg-card">
      <CardHeader className="flex-row items-start gap-3 space-y-0 p-4 pb-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.iconClass}`}><Icon className="h-4 w-4" /></span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-[-0.02em]">{title}</h3>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-1">
        <ul className="space-y-2.5">
          {content.map((item, index) => (
            <li key={`${item}-${index}`} className="flex items-start gap-2.5 text-[11px] leading-[1.55] text-[#666776] dark:text-muted-foreground">
              <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${style.bulletClass}`} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default PromptGuidelineCard;
