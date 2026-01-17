import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LogOut, Settings, Edit } from 'lucide-react';

export function FloatingAdminControl() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditModeActive, setIsEditModeActive] = useState(false);
  
  // Check if user is in admin mode and edit mode
  useEffect(() => {
    const checkAdminStatus = () => {
      const adminStatus = localStorage.getItem("isAdmin") === "true";
      const editMode = localStorage.getItem("editMode") === "true";
      setIsAdmin(adminStatus);
      setIsEditModeActive(editMode);
    };
    
    // Initial check
    checkAdminStatus();
    
    // Listen for changes to admin status
    window.addEventListener('admin-mode-changed', checkAdminStatus);
    window.addEventListener('storage', checkAdminStatus);
    
    return () => {
      window.removeEventListener('admin-mode-changed', checkAdminStatus);
      window.removeEventListener('storage', checkAdminStatus);
    };
  }, []);

  // If not in admin mode, don't render anything
  if (!isAdmin) {
    return null;
  }

  const toggleEditMode = (checked: boolean) => {
    localStorage.setItem("editMode", checked ? "true" : "false");
    setIsEditModeActive(checked);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('admin-mode-changed'));
    
    toast({
      title: checked ? "Edit Mode Enabled" : "Edit Mode Disabled",
      description: checked ? "You can now edit elements on the page" : "Element editing has been turned off",
      variant: "default",
    });
  };

  const handleLogout = () => {
    // Perform admin logout
    fetch('/api/admin/logout', { method: 'POST' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Logout request failed');
        }
        // Clear all admin-related local storage items
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminPinVerified');
        localStorage.removeItem('editMode');
        
        toast({
          title: 'Logged Out',
          description: 'You have been logged out of admin mode',
        });
        
        // Reload page to ensure all admin components are unmounted
        window.location.reload();
      })
      .catch(err => {
        console.error('Logout error:', err);
        toast({
          title: 'Logout Failed',
          description: 'There was an error logging out. Please try again.',
          variant: 'destructive',
        });
      });
  };

  const goToAdminDashboard = () => {
    window.location.href = '/admin';
  };

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2">
      {/* Edit Mode Toggle */}
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-3 mb-2 min-w-[180px]">
        <div className="flex items-center space-x-2">
          <Switch
            id="floating-edit-mode"
            checked={isEditModeActive}
            onCheckedChange={toggleEditMode}
          />
          <Label htmlFor="floating-edit-mode" className="flex items-center gap-1 text-sm font-medium cursor-pointer">
            <Edit className="h-4 w-4" /> Edit Mode
          </Label>
        </div>
      </div>
      
      <Button
        variant="default"
        size="sm"
        className="bg-primary text-white shadow-lg border border-primary/30 rounded-full h-12 w-12 p-0"
        onClick={goToAdminDashboard}
        title="Admin Dashboard"
      >
        <Settings className="h-5 w-5" />
      </Button>
      
      <Button
        variant="destructive"
        size="sm"
        className="bg-red-500 hover:bg-red-600 text-white shadow-lg border border-red-400 rounded-full h-12 w-12 p-0"
        onClick={handleLogout}
        title="Logout from Admin"
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );
}