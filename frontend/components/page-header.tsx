import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 px-6 flex items-center justify-between mb-6 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <div className="flex gap-3">
        {actions}
      </div>
    </div>
  );
}
