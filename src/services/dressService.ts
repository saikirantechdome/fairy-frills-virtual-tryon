
import { supabase } from '@/integrations/supabase/client';

export interface DressOption {
  id: string;
  name: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export const dressService = {
  // Get all dress options from database
  async getDressOptions(): Promise<DressOption[]> {
    const { data, error } = await supabase
      .from('dress_options')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching dress options:', error);
      throw new Error(`Failed to fetch dress options: ${error.message}`);
    }

    return data || [];
  },

  // Upload dress image to Supabase storage and return public URL
  async uploadDressImage(file: File, dressId: string): Promise<string> {
    const fileName = `dress-${dressId}-${Date.now()}.png`;
    const filePath = `dress-options/${fileName}`;

    console.log(`Uploading file to Supabase storage: ${filePath}`);

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('tryon-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload dress image: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('tryon-images')
      .getPublicUrl(data.path);

    console.log(`Generated public URL: ${publicUrl}`);
    return publicUrl;
  },

  // Update dress option with new image URL
  async updateDressImageUrl(dressId: string, imageUrl: string): Promise<void> {
    console.log(`Updating dress ${dressId} with image URL: ${imageUrl}`);
    
    const { error } = await supabase
      .from('dress_options')
      .update({ 
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', dressId);

    if (error) {
      console.error('Error updating dress option:', error);
      throw new Error(`Failed to update dress option: ${error.message}`);
    }

    console.log(`Successfully updated dress ${dressId} with new image URL`);
  }
};
