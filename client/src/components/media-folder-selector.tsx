import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MediaFolder } from "@shared/schema";
import { 
  FolderPlus, FolderEdit, FolderX, FolderInput, 
  FolderOpen, ChevronRight, ChevronDown, 
  Folder as FolderIcon, ImageIcon, Video, Music, Presentation
} from "lucide-react";

interface MediaFolderSelectorProps {
  selectedFolderId: number | null;
  onFolderSelect: (folderId: number | null) => void;
  folderType?: string; // slideshow, video, image, music, general
  className?: string;
}

export function MediaFolderSelector({
  selectedFolderId,
  onFolderSelect,
  folderType,
  className = ""
}: MediaFolderSelectorProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderType, setNewFolderType] = useState(folderType || "general");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [expandedFolderIds, setExpandedFolderIds] = useState<number[]>([]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch all folders
  const { data: folders, isLoading } = useQuery({
    queryKey: ["/api/media-folders"],
    queryFn: async () => {
      const res = await fetch("/api/media-folders");
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json() as Promise<MediaFolder[]>;
    }
  });
  
  // Create new folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (folderData: { 
      name: string; 
      folder_type: string; 
      description?: string;
      parent_id?: number | null;
    }) => {
      const res = await apiRequest("POST", "/api/media-folders", folderData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create folder");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Folder created",
        description: "The folder has been created successfully",
      });
      setCreateDialogOpen(false);
      setNewFolderName("");
      setNewFolderDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/media-folders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating folder",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle folder creation
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a folder name",
        variant: "destructive",
      });
      return;
    }
    
    createFolderMutation.mutate({
      name: newFolderName.trim(),
      folder_type: newFolderType,
      description: newFolderDescription.trim() || undefined,
      parent_id: selectedFolderId
    });
  };
  
  // Folder structure helper functions
  const getChildFolders = (parentId: number | null) => {
    if (!folders) return [];
    return folders.filter(folder => folder.parent_id === parentId);
  };
  
  const isExpanded = (folderId: number) => {
    return expandedFolderIds.includes(folderId);
  };
  
  const toggleExpand = (folderId: number) => {
    if (isExpanded(folderId)) {
      setExpandedFolderIds(expandedFolderIds.filter(id => id !== folderId));
    } else {
      setExpandedFolderIds([...expandedFolderIds, folderId]);
    }
  };
  
  // Get folder icon based on type
  const getFolderIcon = (folderType: string) => {
    switch (folderType) {
      case "image":
        return <ImageIcon className="w-4 h-4 mr-2" />;
      case "video":
        return <Video className="w-4 h-4 mr-2" />;
      case "music":
        return <Music className="w-4 h-4 mr-2" />;
      case "slideshow":
        return <Presentation className="w-4 h-4 mr-2" />;
      default:
        return <FolderIcon className="w-4 h-4 mr-2" />;
    }
  };
  
  // Render folder item recursively
  const renderFolderItem = (folder: MediaFolder, level = 0) => {
    const children = getChildFolders(folder.id);
    const hasChildren = children.length > 0;
    
    // Skip folders of different type if folderType is specified
    if (folderType && folder.folder_type !== folderType && folder.folder_type !== "general") {
      return null;
    }
    
    return (
      <div key={folder.id} className="mb-1">
        <div
          className={`flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-muted ${
            selectedFolderId === folder.id ? "bg-muted font-medium" : ""
          }`}
          style={{ paddingLeft: `${(level * 12) + 8}px` }}
        >
          {hasChildren ? (
            <div 
              className="w-4 h-4 flex items-center justify-center mr-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(folder.id);
              }}
            >
              {isExpanded(folder.id) ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </div>
          ) : (
            <div className="w-4 h-4 mr-1" />
          )}
          
          <div 
            className="flex items-center flex-1 truncate"
            onClick={() => onFolderSelect(folder.id)}
          >
            {getFolderIcon(folder.folder_type)}
            <span className="truncate">{folder.name}</span>
          </div>
        </div>
        
        {hasChildren && isExpanded(folder.id) && (
          <div className="pl-4">
            {children.map(childFolder => renderFolderItem(childFolder, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  // Render root level folders
  const renderFolderTree = () => {
    if (!folders) return null;
    
    const rootFolders = getChildFolders(null);
    
    return (
      <div className="space-y-1">
        {rootFolders.map(folder => renderFolderItem(folder))}
      </div>
    );
  };
  
  return (
    <div className={`border rounded-md p-2 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Media Folders</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setCreateDialogOpen(true)}
          title="Create new folder"
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
        <div
          className={`flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-muted mb-1 ${
            selectedFolderId === null ? "bg-muted font-medium" : ""
          }`}
          onClick={() => onFolderSelect(null)}
        >
          <FolderIcon className="w-4 h-4 mr-2" />
          <span>All Media</span>
        </div>
        
        {isLoading ? (
          <div className="space-y-2 mt-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          renderFolderTree()
        )}
      </div>
      
      {/* Create Folder Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="folder-type">Folder Type</Label>
              <Select 
                value={newFolderType} 
                onValueChange={setNewFolderType}
              >
                <SelectTrigger id="folder-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="slideshow">Slideshows</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="folder-description">Description (Optional)</Label>
              <Input
                id="folder-description"
                placeholder="Enter folder description"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateFolder}
              disabled={createFolderMutation.isPending}
            >
              {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}