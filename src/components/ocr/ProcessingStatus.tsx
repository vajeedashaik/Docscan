import React from 'react';
import { Loader2, CheckCircle2, XCircle, FileText, Zap, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcessingStatus as Status } from '@/types/ocr';

interface ProcessingStatusProps {
  status: Status;
  progress?: number;
  currentStep?: string;
  fileName?: string;
}

const statusConfig: Record<Status, { icon: React.ElementType; label: string; color: string }> = {
  pending: {
    icon: FileText,
    label: 'Waiting to process',
    color: 'text-muted-foreground',
  },
  preprocessing: {
    icon: Zap,
    label: 'Enhancing image',
    color: 'text-warning',
  },
  extracting: {
    icon: Brain,
    label: 'Extracting text with AI',
    color: 'text-primary',
  },
  parsing: {
    icon: Loader2,
    label: 'Parsing & organizing',
    color: 'text-accent',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Extraction complete',
    color: 'text-success',
  },
  failed: {
    icon: XCircle,
    label: 'Extraction failed',
    color: 'text-destructive',
  },
};

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  status,
  progress = 0,
  currentStep,
  fileName,
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isAnimating = ['preprocessing', 'extracting', 'parsing'].includes(status);

  return (
    <div className="shadow-md rounded-lg border border-border bg-card p-6 transition-smooth">
      <div className="flex items-center gap-4">
        <div className={cn(
          'p-3 rounded-xl transition-all duration-300 flex-shrink-0',
          status === 'completed' && 'bg-success/15',
          status === 'failed' && 'bg-destructive/15',
          isAnimating && 'bg-primary/15'
        )}>
          <Icon className={cn(
            'h-6 w-6',
            config.color,
            isAnimating && 'animate-spin'
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn('font-semibold text-sm', config.color)}>
            {config.label}
          </p>
          {fileName && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {fileName}
            </p>
          )}
          {currentStep && isAnimating && (
            <p className="text-xs text-muted-foreground mt-1">
              {currentStep}
            </p>
          )}
        </div>

        {isAnimating && progress > 0 && (
          <div className="text-right flex-shrink-0">
            <span className="text-2xl font-bold text-primary">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isAnimating && (
        <div className="mt-5">
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden shadow-inner-sm">
            <div
              className="h-full gradient-primary transition-all duration-500 ease-out rounded-full shadow-glow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Processing Steps */}
      {isAnimating && (
        <div className="mt-5 grid grid-cols-4 gap-2">
          {['preprocessing', 'extracting', 'parsing', 'completed'].map((step, index) => {
            const stepIndex = ['preprocessing', 'extracting', 'parsing', 'completed'].indexOf(status);
            const isComplete = index < stepIndex;
            const isCurrent = index === stepIndex;

            return (
              <div
                key={step}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition-all duration-300 border',
                  isComplete && 'bg-success/10 border-success/30',
                  isCurrent && 'bg-primary/10 border-primary/30 shadow-md',
                  !isComplete && !isCurrent && 'opacity-50 border-border/30'
                )}
              >
                <div className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all',
                  isComplete && 'bg-success scale-125',
                  isCurrent && 'bg-primary animate-pulse',
                  !isComplete && !isCurrent && 'bg-muted-foreground'
                )} />
                <span className="text-xs text-center capitalize font-semibold">
                  {step === 'preprocessing' ? 'Enhance' : 
                   step === 'extracting' ? 'OCR' :
                   step === 'parsing' ? 'Parse' : 'Done'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Scan line animation component
export const ScanningOverlay: React.FC<{ isScanning: boolean }> = ({ isScanning }) => {
  if (!isScanning) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
    </div>
  );
};
