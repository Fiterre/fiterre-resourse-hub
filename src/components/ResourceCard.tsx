"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Settings,
  FileText,
  AppWindow,
  Dumbbell,
  MessageCircle,
  Calculator,
  Users,
  Calendar,
  Video,
  BookOpen,
  Link2,
  ClipboardList,
  Star,
  Pencil,
  Trash2,
  ExternalLink,
  Shield,
} from "lucide-react";
import { tierLabels, tierColors, type TierLevel } from "@/types";

const iconMap: Record<string, any> = {
  settings: Settings,
  "file-text": FileText,
  "app-window": AppWindow,
  dumbbell: Dumbbell,
  "message-circle": MessageCircle,
  calculator: Calculator,
  users: Users,
  calendar: Calendar,
  video: Video,
  book: BookOpen,
  link: Link2,
  clipboard: ClipboardList,
};

interface ResourceCardProps {
  resource: any;
  categoryConfig: Record<string, { label: string; icon: string; color: string }>;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  isTier1: boolean;
}

export function ResourceCard({
  resource,
  categoryConfig,
  onClick,
  onEdit,
  onDelete,
  onToggleFavorite,
  isTier1,
}: ResourceCardProps) {
  const IconComponent = iconMap[resource.icon || "link"] || Link2;
  const catConfig = categoryConfig[resource.category];
  const labels = resource.labels ? (() => {
    try {
      return JSON.parse(resource.labels);
    } catch {
      return [];
    }
  })() : [];

  return (
    <Card
      className="group relative cursor-pointer hover:shadow-md transition-all duration-200 border-border/50 hover:border-primary/30 overflow-hidden"
      onClick={onClick}
    >
      {/* Favorite & Actions */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-background/80 backdrop-blur"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          <Star
            className={`h-3.5 w-3.5 ${resource.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-background/80 backdrop-blur"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        {isTier1 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-background/80 backdrop-blur text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${catConfig?.color || "bg-muted"}`}
          >
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate">{resource.title}</h3>
              {resource.isExternal && (
                <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {resource.description}
            </p>
          </div>
        </div>

        {/* Labels & Tier */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {resource.requiredTier && (
            <Badge
              className={`text-[10px] px-1.5 py-0 ${tierColors[resource.requiredTier as TierLevel]}`}
              variant="secondary"
            >
              <Shield className="h-2.5 w-2.5 mr-0.5" />
              Tier {resource.requiredTier}
            </Badge>
          )}
          {labels.slice(0, 3).map((label: string) => (
            <Badge
              key={label}
              variant="outline"
              className="text-[10px] px-1.5 py-0"
            >
              {label}
            </Badge>
          ))}
          {labels.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{labels.length - 3}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
