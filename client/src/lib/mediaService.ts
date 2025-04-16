import { MediaAsset } from '@shared/schema';
import { registerAsset, createMediaAsset } from './assetLoader';
import { apiRequest } from './queryClient';

/**
 * Media upload response type
 */
export interface MediaUploadResponse {
  success: boolean;
  assets: MediaAsset[];
  errors?: string[];
}

/**
 * Service for handling media uploads and management
 */
export const mediaService = {
  /**
   * Upload a single media file with progress tracking
   * @param formData FormData object with file and metadata
   * @param progressCallback Optional callback for upload progress
   * @returns Promise with upload response
   */
  async uploadMedia(formData: FormData, progressCallback?: (progress: number) => void): Promise<MediaUploadResponse> {
    try {
      // Use XMLHttpRequest for progress tracking
      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        if (progressCallback) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              progressCallback(progress);
            }
          });
        }
        
        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              
              // Register uploaded assets in the client asset registry
              if (result.assets && Array.isArray(result.assets)) {
                result.assets.forEach((asset: MediaAsset) => {
                  registerAsset(asset);
                });
              }
              
              resolve(result);
            } catch (e) {
              reject(new Error('Invalid server response'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.message || 'Upload failed'));
            } catch (e) {
              reject(new Error(`HTTP error: ${xhr.status}`));
            }
          }
        });
        
        // Handle errors
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });
        
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });
        
        // Send the request
        xhr.open('POST', '/api/media');
        xhr.send(formData);
      });
    } catch (error: any) {
      console.error('Media upload error:', error);
      return {
        success: false,
        assets: [],
        errors: [error.message || 'Unknown error during upload'],
      };
    }
  },
  
  /**
   * Upload multiple files to the server
   * @param files Array of files to upload
   * @param metadata Array of metadata objects corresponding to files
   * @returns Promise with upload response
   */
  async uploadFiles(files: File[], metadata: Record<string, any>[]): Promise<MediaUploadResponse> {
    try {
      // Create a FormData object to send files
      const formData = new FormData();
      
      // Append each file to the form data
      files.forEach((file, index) => {
        formData.append('files', file);
        
        // Add metadata as JSON string to ensure it's properly sent
        if (metadata[index]) {
          formData.append(`metadata[${index}]`, JSON.stringify(metadata[index]));
        }
      });
      
      // Send the request to the server
      const response = await apiRequest('/api/media/upload', {
        method: 'POST',
        body: formData,
        // Note: Don't set Content-Type header when using FormData
        // as the browser will set it correctly with the boundary
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      const result = await response.json();
      
      // Register uploaded assets in the client asset registry
      if (result.assets && Array.isArray(result.assets)) {
        result.assets.forEach((asset: MediaAsset) => {
          registerAsset(asset);
        });
      }
      
      return result;
    } catch (error: any) {
      console.error('Media upload error:', error);
      return {
        success: false,
        assets: [],
        errors: [error.message || 'Unknown error during upload'],
      };
    }
  },
  
  /**
   * Get a list of all media assets
   * @returns Promise with array of media assets
   */
  async getMediaList(): Promise<MediaAsset[]> {
    try {
      const response = await apiRequest('/api/media', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch media assets');
      }
      
      const result = await response.json();
      
      // Register fetched assets in the client asset registry
      if (result.assets && Array.isArray(result.assets)) {
        result.assets.forEach((asset: MediaAsset) => {
          registerAsset(asset);
        });
      }
      
      return result.assets || [];
    } catch (error) {
      console.error('Error fetching media list:', error);
      return [];
    }
  },
  
  /**
   * Delete a media asset by ID
   * @param id ID of the asset to delete
   * @returns Promise with deletion result
   */
  async deleteMedia(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiRequest(`/api/media/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Deletion failed');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Media deletion error:', error);
      return {
        success: false,
        message: error.message || 'Unknown error during deletion',
      };
    }
  },
  
  /**
   * Update media asset metadata
   * @param id ID of the asset to update
   * @param metadata New metadata
   * @returns Promise with updated asset
   */
  async updateMediaMetadata(id: string, metadata: Partial<MediaAsset>): Promise<{ success: boolean; asset?: MediaAsset; message?: string }> {
    try {
      const response = await apiRequest(`/api/media/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metadata }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Update failed');
      }
      
      const result = await response.json();
      
      // Update asset in registry
      if (result.asset) {
        registerAsset(result.asset);
      }
      
      return result;
    } catch (error: any) {
      console.error('Media update error:', error);
      return {
        success: false,
        message: error.message || 'Unknown error during update',
      };
    }
  },
  
  /**
   * Get a media asset by ID
   * @param id ID of the asset to get
   * @returns Promise with the asset
   */
  async getMediaById(id: string): Promise<MediaAsset | null> {
    try {
      const response = await apiRequest(`/api/media/${id}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch media asset');
      }
      
      const result = await response.json();
      
      if (result.asset) {
        registerAsset(result.asset);
        return result.asset;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching media asset:', error);
      return null;
    }
  },
};