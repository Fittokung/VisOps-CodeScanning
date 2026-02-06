// components/ui/StatusBadge.tsx
'use client';

import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ShieldAlert,
  AlertTriangle,
  Ban,
} from 'lucide-react';
import { ReactNode } from 'react';

type StatusType = 
  | 'SUCCESS' 
  | 'FAILED' 
  | 'FAILED_SECURITY' 
  | 'RUNNING' 
  | 'QUEUED' 
  | 'CANCELLED' 
  | 'PENDING'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

interface StatusConfig {
  icon: ReactNode;
  label: string;
  bgColor: string;
  textColor: string;
  animate?: boolean;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  SUCCESS: {
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Success',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-400',
  },
  FAILED: {
    icon: <XCircle className="w-4 h-4" />,
    label: 'Failed',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
  },
  FAILED_SECURITY: {
    icon: <ShieldAlert className="w-4 h-4" />,
    label: 'Security Issue',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-700 dark:text-orange-400',
  },
  RUNNING: {
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    label: 'Running',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    animate: true,
  },
  QUEUED: {
    icon: <Clock className="w-4 h-4" />,
    label: 'Queued',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-700 dark:text-yellow-400',
  },
  CANCELLED: {
    icon: <Ban className="w-4 h-4" />,
    label: 'Cancelled',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-600 dark:text-gray-400',
  },
  PENDING: {
    icon: <Clock className="w-4 h-4" />,
    label: 'Pending',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-600 dark:text-gray-400',
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  icon: <AlertTriangle className="w-4 h-4" />,
  label: 'Unknown',
  bgColor: 'bg-gray-100 dark:bg-gray-800',
  textColor: 'text-gray-600 dark:text-gray-400',
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-base gap-2',
};

/**
 * Reusable status badge component
 */
export default function StatusBadge({
  status,
  size = 'md',
  showLabel = true,
  className = '',
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status?.toUpperCase()] || DEFAULT_CONFIG;
  
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${config.bgColor} ${config.textColor}
        ${SIZE_CLASSES[size]}
        ${className}
      `}
    >
      {config.icon}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

/**
 * Get just the icon for a status
 */
export function getStatusIcon(status: StatusType): ReactNode {
  const config = STATUS_CONFIG[status?.toUpperCase()] || DEFAULT_CONFIG;
  return config.icon;
}

/**
 * Get status configuration
 */
export function getStatusConfig(status: StatusType): StatusConfig {
  return STATUS_CONFIG[status?.toUpperCase()] || DEFAULT_CONFIG;
}
