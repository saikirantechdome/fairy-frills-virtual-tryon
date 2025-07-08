
import { dressService } from '../services/dressService';

// Mapping of dress names to their corresponding uploaded image paths
const dressImageMappings = [
  {
    name: 'Purple Sparkle Dress',
    imagePath: '/lovable-uploads/48565db2-e481-4767-a216-817ea6147143.png'
  },
  {
    name: 'Rose Floral Dress', 
    imagePath: '/lovable-uploads/f9a2d521-c373-40e2-b2c0-f64301423b9e.png'
  },
  {
    name: 'Pink Bow Dress',
    imagePath: '/lovable-uploads/3eb398d8-f887-45fc-bfb7-4b706c9d5296.png'
  },
  {
    name: 'Pink Ruffle Dress',
    imagePath: '/lovable-uploads/9554ffbd-5de4-4638-b723-312f20b6a76d.png'
  },
  {
    name: 'White Tulle Dress',
    imagePath: '/lovable-uploads/dcfbd414-08ff-4830-9e27-74d67519d227.png'
  },
  {
    name: 'Peach Flower Dress',
    imagePath: '/lovable-uploads/bbe34bf8-a8d6-41ca-944b-b1d5dcea8505.png'
  },
  {
    name: 'Black Sparkle Dress',
    imagePath: '/lovable-uploads/aa85ab4e-7481-4243-a8fb-4e78278730f1.png'
  },
  {
    name: 'Blue Princess Dress',
    imagePath: '/lovable-uploads/c775eeac-7d8e-4613-9c1e-05f791713036.png'
  }
];

// Convert local image path to File object
async function pathToFile(imagePath: string, fileName: string): Promise<File> {
  const response = await fetch(imagePath);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type });
}

export async function uploadAllDressImages(): Promise<void> {
  try {
    console.log('Starting to upload dress images to Supabase...');
    
    // Get current dress options from database
    const dressOptions = await dressService.getDressOptions();
    
    for (const dressOption of dressOptions) {
      // Find matching image for this dress
      const imageMapping = dressImageMappings.find(
        mapping => mapping.name === dressOption.name
      );
      
      if (imageMapping) {
        console.log(`Uploading ${dressOption.name}...`);
        
        try {
          // Convert image path to File object
          const file = await pathToFile(imageMapping.imagePath, `${dressOption.name}.png`);
          
          // Upload to Supabase storage and get public URL
          const publicUrl = await dressService.uploadDressImage(file, dressOption.id);
          
          // Update database with new public URL
          await dressService.updateDressImageUrl(dressOption.id, publicUrl);
          
          console.log(`Successfully uploaded ${dressOption.name} - Public URL: ${publicUrl}`);
        } catch (error) {
          console.error(`Failed to upload ${dressOption.name}:`, error);
        }
      } else {
        console.warn(`No image mapping found for ${dressOption.name}`);
      }
    }
    
    console.log('Finished uploading dress images to Supabase');
  } catch (error) {
    console.error('Error uploading dress images:', error);
    throw error;
  }
}
