"use client";

import { forwardRef } from "react";
import { Button, type ButtonProps } from "./button";
import { Spinner } from "./spinner";
import { cn } from "@/lib/utils";

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;   // replaces children while loading
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, loadingText, disabled, children, className, ...rest }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={loading || disabled}
        className={cn(className, loading && "pointer-events-none")}
        {...rest}
      >
        {loading ? (
          <>
            <Spinner className="text-current" size="12px" />
            <span className="fade-in">{loadingText ?? children}</span>
          </>
        ) : (
          children
        )}
      </Button>
    );
  },
);
LoadingButton.displayName = "LoadingButton";
