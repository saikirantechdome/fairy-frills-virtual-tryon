
// Utility script to upload dress images to Supabase
// This will be used to populate the database with actual image URLs

import { supabase } from '@/integrations/supabase/client';

const dressImages = [
  {
    id: 1,
    name: 'Purple Sparkle Dress',
    fileName: '53ec6ccd-1666-4f47-a500-a2a9d6082d5a.png'
  },
  {
    id: 2,
    name: 'Rose Floral Dress',
    fileName: '9d4d1447-18a8-4911-ab2d-35243d3ed1cb.png'
  },
  {
    id: 3,
    name: 'Pink Bow Dress',
    fileName: 'abeeb785-687b-4e7a-9ab5-b09044db0915.png'
  },
  {
    id: 4,
    name: 'Pink Ruffle Dress',
    fileName: 'b862e418-a382-4396-a235-a3e699069f57.png'
  },
  {
    id: 5,
    name: 'White Tulle Dress',
    fileName: 'ad6ef091-a448-4523-8d8e-6b99a01e3959.png'
  },
  {
    id: 6,
    name: 'Peach Flower Dress',
    fileName: '10683506-034a-4b85-8573-f6c5ce75726b.png'
  },
  {
    id: 7,
    name: 'Black Sparkle Dress',
    fileName: 'd989ce6e-985e-419a-9de8-242b68d01613.png'
  },
  {
    id: 8,
    name: 'Blue Princess Dress',
    fileName: 'e2a68b90-0c22-487b-8ad9-b67d5b265161.png'
  },
  {
    id: 9,
    name: 'Yellow Rose Dress',
    fileName: '25f1e6e3-09f4-4a7e-91fb-23d5c7c7681f.png'
  }
];

export const uploadDressImagesToSupabase = async () => {
  console.log('Starting dress images upload to Supabase...');
  
  for (const dress of dressImages) {
    try {
      // Fetch the image from the public folder
      const response = await fetch(`/lovable-uploads/${dress.fileName}`);
      if (!response.ok) {
        console.error(`Failed to fetch ${dress.fileName}`);
        continue;
      }
      
      const blob = await response.blob();
      const file = new File([blob], dress.fileName, { type: 'image/png' });
      
      // Upload to Supabase storage
      const filePath = `dress-options/${dress.fileName}`;
      const { data, error: uploadError } = await supabase.storage
        .from('tryon-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwrite if exists
        });

      if (uploadError) {
        console.error(`Upload error for ${dress.name}:`, uploadError);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('tryon-images')
        .getPublicUrl(data.path);

      // Update database with actual URL
      const { error: updateError } = await supabase
        .from('dress_options')
        .update({ image_url: publicUrl })
        .eq('name', dress.name);

      if (updateError) {
        console.error(`Database update error for ${dress.name}:`, updateError);
        continue;
      }

      console.log(`Successfully uploaded and updated ${dress.name}`);
      
    } catch (error) {
      console.error(`Error processing ${dress.name}:`, error);
    }
  }
  
  console.log('Dress images upload completed!');
};
