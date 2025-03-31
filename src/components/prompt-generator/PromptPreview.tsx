
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PromptPreviewProps {
  prompt: string;
  isComplete: boolean;
  onCopy: () => void;
}

const PromptPreview: React.FC<PromptPreviewProps> = ({ 
  prompt, 
  isComplete,
  onCopy
}) => {
  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-purple-700">
            Prompt Preview
          </CardTitle>
          {isComplete ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircleIcon className="h-3 w-3 mr-1" /> Ready
            </Badge>
          ) : (
            <Badge variant="outline">
              <AlertCircleIcon className="h-3 w-3 mr-1" /> Draft
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {prompt ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg overflow-auto max-h-[calc(100vh-320px)] whitespace-pre-line">
              {prompt}
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={onCopy}
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={!isComplete}
              >
                <ClipboardIcon className="mr-2 h-4 w-4" />
                Copy to Clipboard
              </Button>
              
              {!isComplete && (
                <p className="text-xs text-muted-foreground text-center">
                  Complete all required sections to finalize your prompt
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <div className="rounded-full bg-muted p-3">
              <ClipboardIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">No prompt content yet</p>
              <p className="text-xs text-muted-foreground">
                Fill in the sections on the left to generate your prompt
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromptPreview;
