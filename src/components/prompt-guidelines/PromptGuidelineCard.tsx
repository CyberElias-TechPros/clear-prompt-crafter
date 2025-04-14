
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
import { Info } from "lucide-react";

interface GuidelineProps {
  title: string;
  description: string;
  content: string[];
}

const PromptGuidelineCard: React.FC<GuidelineProps> = ({
  title,
  description,
  content,
}) => {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-purple-700">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-4">
            {content.map((item, index) => (
              <Alert key={index} variant="default" className="bg-muted">
                <Info className="h-4 w-4" />
                <AlertTitle>Tip #{index + 1}</AlertTitle>
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
