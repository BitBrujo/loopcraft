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

          <div className="bg-muted p-4 rounded-md">
            <h4 className="text-sm font-medium mb-2">Examples:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>
                <button
                  className="hover:text-foreground transition-colors"
                  onClick={() => onChange("https://example.com")}
                >
                  https://example.com
                </button>
              </li>
              <li>
                <button
                  className="hover:text-foreground transition-colors"
                  onClick={() => onChange("https://wikipedia.org")}
                >
                  https://wikipedia.org
                </button>
              </li>
              <li>
                <button
                  className="hover:text-foreground transition-colors"
                  onClick={() => onChange("https://github.com")}
                >
                  https://github.com
                </button>
              </li>
            </ul>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-md">
            <h4 className="text-sm font-medium mb-1 text-amber-700 dark:text-amber-400">
              Note
            </h4>
            <p className="text-sm text-muted-foreground">
              Some websites may not allow embedding due to X-Frame-Options or CSP headers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
