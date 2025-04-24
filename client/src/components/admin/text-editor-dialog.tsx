import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X, ScreenShare, Text, Plus, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type as TypeIcon } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface TextEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newContent: string, options?: TextSaveOptions) => void;
  elementId?: string | number;
  initialContent?: string;
  title?: string;
  description?: string;
  multiline?: boolean;
  isCreatingNew?: boolean;
}

export interface TextSaveOptions {
  elementType?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'div';
  className?: string;
  insertLocation?: 'before' | 'after' | 'append' | 'prepend';
  styles?: {
    color?: string;
    fontSize?: string;
    fontWeight?: 'normal' | 'bold' | '400' | '500' | '600' | '700' | '800';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    margin?: string;
    padding?: string;
  };
}

export function TextEditorDialog({
  isOpen,
  onClose,
  onSave,
  elementId,
  initialContent = '',
  title = 'Edit Text',
  description = 'Update the text content',
  multiline = true,
  isCreatingNew = false
}: TextEditorDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Options for new text element creation
  const [elementType, setElementType] = useState<TextSaveOptions['elementType']>('p');
  const [insertLocation, setInsertLocation] = useState<TextSaveOptions['insertLocation']>('after');
  
  // Style options
  const [textColor, setTextColor] = useState<string>('#000000');
  const [fontSize, setFontSize] = useState<string>('16px');
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
  const [textDecoration, setTextDecoration] = useState<'none' | 'underline'>('none');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  
  // Reset content when dialog opens with new initial content
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      
      // Check if we're on a mobile device
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      
      // Focus the input after a slight delay (for mobile keyboards)
      const timer = setTimeout(() => {
        if (multiline && textareaRef.current) {
          textareaRef.current.focus();
        } else if (!multiline && inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialContent, multiline]);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Close on Escape
    if (e.key === 'Escape') {
      onClose();
    }
    
    // Save on Ctrl+Enter or Cmd+Enter (for multiline)
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = () => {
    if (isCreatingNew) {
      // Save with options for new text element
      onSave(content, {
        elementType,
        insertLocation,
        styles: {
          color: textColor,
          fontSize,
          fontWeight,
          fontStyle,
          textDecoration,
          textAlign
        }
      });
    } else {
      // Standard save for existing text with any styling changes
      onSave(content, {
        styles: {
          color: textColor,
          fontSize,
          fontWeight,
          fontStyle,
          textDecoration,
          textAlign
        }
      });
    }
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] p-4 sm:p-6' : 'max-w-2xl'} touch-manipulation rounded-lg`}>
        <form onSubmit={handleSubmit}>
          <DialogHeader className={isMobile ? 'mb-2 space-y-1' : ''}>
            <DialogTitle className={isMobile ? 'text-lg' : ''}>
              {title}
              {elementId && <span className="ml-2 text-sm text-blue-500">#{elementId}</span>}
            </DialogTitle>
            <DialogDescription className={isMobile ? 'text-sm' : ''}>
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Text Content</TabsTrigger>
                <TabsTrigger value="styling">Styling Options</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="pt-4">
                <div className="grid w-full gap-2">
                  <Label htmlFor="content">Content</Label>
                  {multiline ? (
                    <Textarea
                      ref={textareaRef}
                      id="content"
                      className="min-h-[150px] touch-manipulation"
                      placeholder="Enter text content here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoCapitalize="sentences"
                      spellCheck={true}
                      autoFocus={!isMobile}
                    />
                  ) : (
                    <Input
                      ref={inputRef}
                      id="content"
                      className="touch-manipulation"
                      placeholder="Enter text content here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoCapitalize="sentences"
                      spellCheck={true}
                      autoFocus={!isMobile}
                    />
                  )}
                  
                  {isMobile && (
                    <div className="mt-2 flex items-center text-xs text-muted-foreground">
                      <Text className="h-3 w-3 mr-1" />
                      <span>Use the keyboard or tap buttons below to edit text</span>
                    </div>
                  )}
                  
                  {isCreatingNew && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      <h3 className="text-sm font-medium">New Text Element Options</h3>
                      
                      <div className="space-y-3">
                        {/* Element Type Selection */}
                        <div className="space-y-1">
                          <Label htmlFor="elementType">Element Type</Label>
                          <Select 
                            value={elementType} 
                            onValueChange={(value) => setElementType(value as TextSaveOptions['elementType'])}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select element type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="p">Paragraph</SelectItem>
                              <SelectItem value="h1">Heading 1 (Largest)</SelectItem>
                              <SelectItem value="h2">Heading 2</SelectItem>
                              <SelectItem value="h3">Heading 3</SelectItem>
                              <SelectItem value="h4">Heading 4</SelectItem>
                              <SelectItem value="span">Span (Inline Text)</SelectItem>
                              <SelectItem value="div">Div (Container)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Insert Location */}
                        {elementId && (
                          <div className="space-y-1">
                            <Label>Insert Location</Label>
                            <RadioGroup 
                              value={insertLocation} 
                              onValueChange={(value) => setInsertLocation(value as TextSaveOptions['insertLocation'])}
                              className="grid grid-cols-2 gap-2"
                            >
                              <div className="flex items-center space-x-2 border rounded-md p-2">
                                <RadioGroupItem value="before" id="before" />
                                <Label htmlFor="before" className="cursor-pointer">Before selected element</Label>
                              </div>
                              <div className="flex items-center space-x-2 border rounded-md p-2">
                                <RadioGroupItem value="after" id="after" />
                                <Label htmlFor="after" className="cursor-pointer">After selected element</Label>
                              </div>
                              <div className="flex items-center space-x-2 border rounded-md p-2">
                                <RadioGroupItem value="append" id="append" />
                                <Label htmlFor="append" className="cursor-pointer">Inside (at end)</Label>
                              </div>
                              <div className="flex items-center space-x-2 border rounded-md p-2">
                                <RadioGroupItem value="prepend" id="prepend" />
                                <Label htmlFor="prepend" className="cursor-pointer">Inside (at beginning)</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="styling" className="pt-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Text Styling Options</h3>
                  
                  {/* Text Formatting Toolbar */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <ToggleGroup type="multiple" className="flex flex-wrap">
                      <ToggleGroupItem 
                        value="bold" 
                        aria-label="Toggle bold"
                        data-state={fontWeight === 'bold' ? 'on' : 'off'}
                        onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')}
                      >
                        <Bold className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem 
                        value="italic" 
                        aria-label="Toggle italic"
                        data-state={fontStyle === 'italic' ? 'on' : 'off'}
                        onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
                      >
                        <Italic className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem 
                        value="underline" 
                        aria-label="Toggle underline"
                        data-state={textDecoration === 'underline' ? 'on' : 'off'}
                        onClick={() => setTextDecoration(textDecoration === 'underline' ? 'none' : 'underline')}
                      >
                        <Underline className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>

                    <div className="w-0.5 h-8 bg-gray-200 mx-1"></div>
                    
                    <ToggleGroup type="single" value={textAlign} onValueChange={(value) => value && setTextAlign(value as 'left' | 'center' | 'right' | 'justify')}>
                      <ToggleGroupItem value="left" aria-label="Align left">
                        <AlignLeft className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="center" aria-label="Align center">
                        <AlignCenter className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="right" aria-label="Align right">
                        <AlignRight className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="justify" aria-label="Justify">
                        <AlignJustify className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  
                  {/* Text Color and Size */}
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="textColor">Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="textColor"
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-10 h-10 p-1 bg-transparent"
                        />
                        <Input
                          type="text"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="fontSize">Font Size</Label>
                        <span className="text-xs text-muted-foreground">{fontSize}</span>
                      </div>
                      <Select
                        value={fontSize}
                        onValueChange={setFontSize}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select font size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12px">Small (12px)</SelectItem>
                          <SelectItem value="14px">Regular (14px)</SelectItem>
                          <SelectItem value="16px">Medium (16px)</SelectItem>
                          <SelectItem value="18px">Large (18px)</SelectItem>
                          <SelectItem value="20px">Extra Large (20px)</SelectItem>
                          <SelectItem value="24px">Heading (24px)</SelectItem>
                          <SelectItem value="32px">Title (32px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Preview */}
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <h4 className="text-sm font-medium flex items-center">
                      <TypeIcon className="h-4 w-4 mr-1" />
                      Style Preview
                    </h4>
                    <div 
                      className="p-4 border rounded-md min-h-[100px] overflow-auto"
                      style={{
                        color: textColor,
                        fontSize,
                        fontWeight,
                        fontStyle,
                        textDecoration,
                        textAlign
                      }}
                    >
                      {content || "Preview of your text with the selected styling options"}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className={isMobile ? 'flex-col sm:flex-row gap-2 sm:gap-0' : ''}>
            {isMobile && (
              <div className="w-full flex justify-between items-center mb-2 pb-2 border-b text-xs text-muted-foreground">
                <div className="flex items-center">
                  <ScreenShare className="h-3 w-3 mr-1" />
                  <span>Keyboard shortcuts: Esc = Cancel, Ctrl+Enter = Save</span>
                </div>
              </div>
            )}
            
            <Button 
              type="button" 
              variant="outline" 
              className={`touch-manipulation ${isMobile ? 'py-6 text-base w-full' : ''}`}
              onClick={onClose}
            >
              <X className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} />
              Cancel
            </Button>
            <Button 
              type="submit"
              className={`bg-blue-500 hover:bg-blue-600 touch-manipulation ${isMobile ? 'py-6 text-base w-full' : ''}`}
            >
              <Save className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} />
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}