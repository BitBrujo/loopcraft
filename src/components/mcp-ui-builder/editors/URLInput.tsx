"use client";

import { useState } from "react";
import { ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface URLInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function URLInput({ value, onChange }: URLInputProps) {
  const [isValid, setIsValid] = useState(true);

  const validateURL = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsValid(validateURL(newValue));
  };

  const handlePreview = () => {
    if (isValid && value) {
      window.open(value, "_blank");
    }
  };

  return (
    <div className="h-full p-6">
      <div className="max-w-2xl">
        <h3 className="text-lg font-semibold mb-2">External URL</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Enter the URL of an external website or web application to embed.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">URL</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="url"
                  value={value}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className={!isValid && value ? "border-red-500" : ""}
                />
                {value && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!isValid || !value}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
            {!isValid && value && (
              <p className="text-sm text-red-500 mt-1">Please enter a valid URL</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
