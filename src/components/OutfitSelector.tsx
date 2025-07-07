
import { cn } from '../lib/utils';

interface OutfitSelectorProps {
  onSelect: (dressUrl: string) => void;
  selectedDress: string | null;
}

export const OutfitSelector = ({ onSelect, selectedDress }: OutfitSelectorProps) => {
  const sampleOutfits = [
    {
      id: 'dress-1',
      url: '/lovable-uploads/53ec6ccd-1666-4f47-a500-a2a9d6082d5a.png',
      name: 'Purple Sparkle Dress'
    },
    {
      id: 'dress-2',
      url: '/lovable-uploads/9d4d1447-18a8-4911-ab2d-35243d3ed1cb.png',
      name: 'Rose Floral Dress'
    },
    {
      id: 'dress-3',
      url: '/lovable-uploads/abeeb785-687b-4e7a-9ab5-b09044db0915.png',
      name: 'Pink Bow Dress'
    },
    {
      id: 'dress-4',
      url: '/lovable-uploads/b862e418-a382-4396-a235-a3e699069f57.png',
      name: 'Pink Ruffle Dress'
    },
    {
      id: 'dress-5',
      url: '/lovable-uploads/ad6ef091-a448-4523-8d8e-6b99a01e3959.png',
      name: 'White Tulle Dress'
    },
    {
      id: 'dress-6',
      url: '/lovable-uploads/10683506-034a-4b85-8573-f6c5ce75726b.png',
      name: 'Peach Flower Dress'
    },
    {
      id: 'dress-7',
      url: '/lovable-uploads/d989ce6e-985e-419a-9de8-242b68d01613.png',
      name: 'Black Sparkle Dress'
    },
    {
      id: 'dress-8',
      url: '/lovable-uploads/e2a68b90-0c22-487b-8ad9-b67d5b265161.png',
      name: 'Blue Princess Dress'
    },
    {
      id: 'dress-9',
      url: '/lovable-uploads/25f1e6e3-09f4-4a7e-91fb-23d5c7c7681f.png',
      name: 'Yellow Rose Dress'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {sampleOutfits.map((outfit) => (
        <div
          key={outfit.id}
          onClick={() => onSelect(outfit.url)}
          className={cn(
            'relative cursor-pointer rounded-lg overflow-hidden group transition-all duration-200',
            selectedDress === outfit.url
              ? 'ring-2 ring-[#E799AA] ring-offset-2'
              : 'hover:ring-2 hover:ring-[#E799AA]/50 hover:ring-offset-1'
          )}
        >
          <div className="aspect-[3/4] overflow-hidden">
            <img
              src={outfit.url}
              alt={outfit.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-white text-xs font-medium truncate">
                {outfit.name}
              </p>
            </div>
          </div>
          
          {/* Selected indicator */}
          {selectedDress === outfit.url && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-[#E799AA] rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
