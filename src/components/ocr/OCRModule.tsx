import React, { useState } from 'react';
import { 
  Play, 
  Trash2, 
  Download,
  Settings2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { FileUploadZone } from './FileUploadZone';
import { ProcessingStatus } from './ProcessingStatus';
import { ResultsViewer } from './ResultsViewer';
import { useOCR } from '@/hooks/useOCR';

interface OCRModuleProps {
  onScanComplete?: () => void | Promise<void>;
}

export const OCRModule: React.FC<OCRModuleProps> = ({ onScanComplete }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [preprocessEnabled, setPreprocessEnabled] = useState(true);
  const [extractReminders, setExtractReminders] = useState(true);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');

  console.log('OCRModule: onScanComplete callback received?', typeof onScanComplete);

  const {
    files,
    results,
    isProcessing,
    addFiles,
    removeFile,
    processFiles,
    clearAll,
    exportResults,
  } = useOCR({
    autoPreprocess: preprocessEnabled,
    extractReminders,
    onScanComplete,
    productName,
    category,
  });

  const pendingFiles = files.filter(f => f.status === 'pending');
  const processingFile = files.find(f => 
    f.status === 'preprocessing' || 
    f.status === 'extracting' || 
    f.status === 'parsing'
  );

  const handleExportSingleResult = (index: number) => {
    const result = results[index];
    if (!result) return;

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-${result.metadata.fileName}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Pre-scan details form */}
      <Card className="border-border/50 shadow-md">
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="product-name" className="text-sm font-semibold">
              Product / Topic Name
            </Label>
            <Input
              id="product-name"
              placeholder="e.g. LG 1.5 Ton Split AC"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {['air conditioner','air fryers','air purifier','bathroom fittings','battery','blender','camera','cctv','chimney','clocks','coffee machines','computer or laptop','cooker','cooler','dishwasher','dth','electric kettles','exercise equipments','fan','fashion accessories','food processor','freezer','furniture','game console','geyser','gps tracker','griller','hair dryer','hardware equipment','heater','induction','irons','ladder','lights','mattresses','medical equipments','microwave oven','mobile or telephone','music systems','powerbank','printer','refrigerator','RO machine','sewing machine','small kitchen appliances','sports equipment','stove','baggage','television','toaster','tire','vaccuum cleaners','washing machines','watches'].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Upload Zone */}
      <FileUploadZone
        onFilesAdded={addFiles}
        uploadedFiles={files}
        onRemoveFile={removeFile}
        disabled={isProcessing}
      />

      {/* Settings - Collapsible */}
      <Collapsible open={showSettings} onOpenChange={setShowSettings}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between h-10 hover:bg-secondary/30 transition-smooth">
            <span className="flex items-center gap-2 text-muted-foreground font-semibold">
              <Settings2 className="h-4 w-4" />
              Settings
            </span>
            {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="border-border/50 mt-3 shadow-md">
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <Label htmlFor="preprocess" className="text-sm font-semibold">
                  Auto-enhance images
                </Label>
                <Switch
                  id="preprocess"
                  checked={preprocessEnabled}
                  onCheckedChange={setPreprocessEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="reminders" className="text-sm font-semibold">
                  Extract reminders
                </Label>
                <Switch
                  id="reminders"
                  checked={extractReminders}
                  onCheckedChange={setExtractReminders}
                />
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Processing Status */}
      {processingFile && (
        <ProcessingStatus
          status={processingFile.status}
          progress={processingFile.progress}
          fileName={processingFile.file.name}
        />
      )}

      {/* Action Buttons */}
      {files.length > 0 && (
        <div className="flex gap-3">
          <Button
            onClick={processFiles}
            disabled={isProcessing || pendingFiles.length === 0}
            className="flex-1 h-11 font-semibold text-base transition-smooth"
          >
            <Play className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : `Scan ${pendingFiles.length > 0 ? `(${pendingFiles.length})` : ''}`}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={clearAll}
            disabled={isProcessing}
            className="h-11 w-11 transition-smooth hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-border/30 pb-3">
            <h3 className="text-xl font-bold text-foreground">
              Results <span className="text-accent font-semibold">({results.length})</span>
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={exportResults}
              className="h-9 font-semibold transition-smooth hover:bg-primary/10"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export All
            </Button>
          </div>
          
          {/* Show each result */}
          <div className="space-y-5">
            {results.map((result, index) => (
              <ResultsViewer 
                key={result.id} 
                result={result} 
                onExportJSON={() => handleExportSingleResult(index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
