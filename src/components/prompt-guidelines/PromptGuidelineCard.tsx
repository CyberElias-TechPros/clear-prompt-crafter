
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, CheckCircle, HelpCircle, Search, Bug } from "lucide-react";

interface GuidelineProps {
  title: string;
  description: string;
  content: string[];
  variant?: 'default' | 'tip' | 'warning' | 'success' | 'debug';
}

const PromptGuidelineCard: React.FC<GuidelineProps> = ({
  title,
  description,
  content,
  variant = 'default',
}) => {
  // Select icon based on variant
  const renderIcon = () => {
    switch (variant) {
      case 'tip':
        return <Info className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'debug':
        return <Bug className="h-4 w-4 text-blue-500" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  // Select background color based on variant
  const getAlertStyles = () => {
    switch (variant) {
      case 'tip':
        return "bg-muted";
      case 'warning':
        return "bg-amber-50 dark:bg-amber-950/30";
      case 'success':
        return "bg-green-50 dark:bg-green-950/30";
      case 'debug':
        return "bg-blue-50 dark:bg-blue-950/30";
      default:
        return "bg-muted";
    }
  };

  // Get title prefix based on variant
  const getTitlePrefix = () => {
    switch (variant) {
      case 'tip':
        return "Tip #";
      case 'warning':
        return "Warning #";
      case 'success':
        return "Practice #";
      case 'debug':
        return "Debug Tip #";
      default:
        return "Item #";
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className={`text-xl font-bold ${
          variant === 'warning' ? 'text-amber-600' :
          variant === 'success' ? 'text-green-600' :
          variant === 'debug' ? 'text-blue-600' :
          'text-purple-700'
        }`}>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-4">
            {content.map((item, index) => (
              <Alert key={index} variant="default" className={getAlertStyles()}>
                {renderIcon()}
                <AlertTitle>{getTitlePrefix()}{index + 1}</AlertTitle>
                <AlertDescription>{item}</AlertDescription>
              </Alert>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PromptGuidelineCard;
