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
import { Checkbox } from '@/components/ui/checkbox';
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
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [preprocessEnabled, setPreprocessEnabled] = useState(true);
  const [extractReminders, setExtractReminders] = useState(true);
  const [productName, setProductName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [productCount, setProductCount] = useState('');
  const [showQuestionnaireError, setShowQuestionnaireError] = useState(false);

  // Check if all questionnaire fields are filled
  const isQuestionnaireComplete = productName.trim() !== '' && selectedCategories.length > 0 && productCount.trim() !== '';

  const categoryList = ['air conditioner','air fryers','air purifier','bathroom fittings','battery','blender','camera','cctv','chimney','clocks','coffee machines','computer or laptop','cooker','cooler','dishwasher','dth','electric kettles','exercise equipments','fan','fashion accessories','food processor','freezer','furniture','game console','geyser','gps tracker','griller','hair dryer','hardware equipment','heater','induction','irons','ladder','lights','mattresses','medical equipments','microwave oven','mobile or telephone','music systems','powerbank','printer','refrigerator','RO machine','sewing machine','small kitchen appliances','sports equipment','stove','baggage','television','toaster','tire','vaccuum cleaners','washing machines','watches'];

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    );
  };

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
    category: selectedCategories.join(','),
    productCount,
  });

  const handleScanClick = () => {
    if (!isQuestionnaireComplete) {
      setShowQuestionnaireError(true);
      return;
    }
    setShowQuestionnaireError(false);
    processFiles();
  };

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
              Company Name
            </Label>
            <Input
              id="product-name"
              placeholder="e.g. LG Electronics"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">
              Categories
            </Label>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full h-10 justify-between text-left font-normal"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <span className="truncate text-sm">
                  {selectedCategories.length > 0 
                    ? `${selectedCategories.length} selected` 
                    : 'Select categories'}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
              
              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 border border-border rounded-md bg-background shadow-md z-50 max-h-80 overflow-y-auto">
                  <div className="p-3 space-y-2">
                    {categoryList.map((cat) => (
                      <div key={cat} className="flex items-center gap-2">
                        <Checkbox
                          id={`cat-${cat}`}
                          checked={selectedCategories.includes(cat)}
                          onCheckedChange={() => toggleCategory(cat)}
                        />
                        <Label
                          htmlFor={`cat-${cat}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {cat}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCategories.map((cat) => (
                  <div
                    key={cat}
                    className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-xs"
                  >
                    {cat}
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="ml-1 hover:text-primary/70"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-count" className="text-sm font-semibold">
              How many products does the bill contain?
            </Label>
            <Input
              id="product-count"
              type="number"
              placeholder="e.g. 5"
              value={productCount}
              onChange={(e) => setProductCount(e.target.value)}
              className="h-10"
              min="1"
            />
          </div>

          {/* Questionnaire Validation Error */}
          {showQuestionnaireError && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
              <p className="text-sm text-destructive font-semibold">
                Please answer all questions before scanning:
              </p>
              <ul className="text-xs text-destructive/80 mt-2 space-y-1">
                {!productName.trim() && <li>• Company Name is required</li>}
                {selectedCategories.length === 0 && <li>• Select at least one category</li>}
                {!productCount.trim() && <li>• Product count is required</li>}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Zone */}
      {isQuestionnaireComplete ? (
        <FileUploadZone
          onFilesAdded={addFiles}
          uploadedFiles={files}
          onRemoveFile={removeFile}
          disabled={isProcessing}
        />
      ) : (
        <Card className="border-border/50 shadow-md bg-muted/30">
          <CardContent className="p-6 text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
              <span className="text-amber-600 font-semibold text-lg">!</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Complete the questionnaire first
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Answer all 3 questions above to unlock file upload
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
            onClick={handleScanClick}
            disabled={isProcessing || pendingFiles.length === 0 || !isQuestionnaireComplete}
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
