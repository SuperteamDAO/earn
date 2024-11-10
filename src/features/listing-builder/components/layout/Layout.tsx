import { Meta } from "@/layouts/Meta";
import { cn } from "@/utils";
import { useEffect, type ReactNode } from "react";
import {Header} from "./Header";
import { useAtomValue } from "jotai";

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function Layout({
  className,
  children,
  ...props
}: LayoutProps) {
  return (
    <div 
      className={cn(
        "flex min-h-screen flex-col justify-between bg-background",
        className
      )}
      {...props}
    >
      <Meta 
        title="Create a Listing | Superteam Earn" 
        description="Create a listing on Superteam Earn and gain access to thousands of high quality talent" 
      />
      <Header />
      <div className="flex flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
