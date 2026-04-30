import { motion } from "motion/react";
import { Clock, MapPin, Shield, Star } from "lucide-react";

interface HelperCardProps {
  name: string;
  service: string;
  rating: number;
  reviews: number;
  experience: string;
  location: string;
  verified: boolean;
  imageUrl: string;
  delay?: number;
  onBook?: () => void;
  onViewDetails?: () => void;
  detailsLabel?: string;
}

const fallbackImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop';

export function HelperCard({
  name,
  service,
  rating,
  reviews,
  experience,
  location,
  verified,
  imageUrl,
  delay = 0,
  onBook,
  onViewDetails,
  detailsLabel = "View details"
}: HelperCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-gray-100"
    >
      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-50">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(event) => {
            event.currentTarget.src = fallbackImage;
          }}
        />
        {verified && (
          <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Verified
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <h3 className="text-gray-900 font-semibold text-lg">{name}</h3>
            <p className="text-blue-600 text-sm font-medium">{service}</p>
          </div>
          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-gray-900">{rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="break-words">{location}</span>
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-sm mb-4">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{experience} experience</span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>{reviews} reviews</span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(rating)
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          {onViewDetails && (
            <button
              type="button"
              onClick={onViewDetails}
              className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2.5 rounded-xl transition-colors"
            >
              {detailsLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onBook}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors"
          >
            Book now
          </button>
        </div>
      </div>
    </motion.div>
  );
}
