
import { dressService } from '../services/dressService';

// Mapping of dress names to their corresponding uploaded image paths
const dressImageMappings = [
  {
    name: 'Purple Sparkle Dress',
    imagePath: '/lovable-uploads/15cde8fc-66cc-4549-8fa6-cafe1c1d6968.png'
  },
  {
    name: 'Rose Floral Dress', 
    imagePath: '/lovable-uploads/af95916a-f7f9-402b-8118-08c89b9263b2.png'
  },
  {
    name: 'Pink Bow Dress',
    imagePath: '/lovable-uploads/5cdd24d5-1633-40e7-99ce-3c382d9a1024.png'
  },
  {
    name: 'Pink Ruffle Dress',
    imagePath: '/lovable-uploads/4807d879-ca98-44d7-8d28-128a4ad011a6.png'
  },
  {
    name: 'White Tulle Dress',
    imagePath: '/lovable-uploads/d4148529-54e6-4477-a708-3e9980de944b.png'
  },
  {
    name: 'Peach Flower Dress',
    imagePath: '/lovable-uploads/9580a538-2c00-499d-b2c3-2849454ed4f9.png'
  },
  {
    name: 'Black Sparkle Dress',
    imagePath: '/lovable-uploads/1a77594f-0da2-42c9-9578-41db60e8d795.png'
  },
  {
    name: 'Blue Princess Dress',
    imagePath: '/lovable-uploads/1fae24a0-e45a-4102-951f-5c0613bb72ce.png'
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
          
          // Upload to Supabase storage
          const publicUrl = await dressService.uploadDressImage(file, dressOption.id);
          
          // Update database with new public URL
          await dressService.updateDressImageUrl(dressOption.id, publicUrl);
          
          console.log(`Successfully uploaded ${dressOption.name} - URL: ${publicUrl}`);
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
