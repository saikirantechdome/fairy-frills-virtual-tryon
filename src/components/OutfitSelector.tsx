
import { cn } from '../lib/utils';

interface OutfitSelectorProps {
  onSelect: (dressUrl: string) => void;
  selectedDress: string | null;
}

export const OutfitSelector = ({ onSelect, selectedDress }: OutfitSelectorProps) => {
  const sampleOutfits = [
    {
      id: 'dress-1',
      url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=400&q=80',
      name: 'Elegant Black Dress'
    },
    {
      id: 'dress-2',
      url: 'https://images.unsplash.com/photo-1566479179817-28e1f7ac4dce?auto=format&fit=crop&w=400&q=80',
      name: 'Summer Floral Dress'
    },
    {
      id: 'dress-3',
      url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=400&q=80',
      name: 'Casual Blue Shirt'
    },
    {
      id: 'dress-4',
      url: 'https://images.unsplash.com/photo-1567171434019-84cbf69a26cf?auto=format&fit=crop&w=400&q=80',
      name: 'Cozy Sweater'
    },
    {
      id: 'dress-5',
      url: 'https://images.unsplash.com/photo-1520429055906-87037b7d0ba9?auto=format&fit=crop&w=400&q=80',
      name: 'Red Evening Dress'
    },
    {
      id: 'dress-6',
      url: 'https://images.unsplash.com/photo-1533827432537-70133748f5c8?auto=format&fit=crop&w=400&q=80',
      name: 'White Casual Top'
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
              ? 'ring-2 ring-purple-500 ring-offset-2'
              : 'hover:ring-2 hover:ring-purple-300 hover:ring-offset-1'
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
            <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
