import { motion } from 'motion/react';
import { Star, Calendar } from 'lucide-react';
import { Review } from '@/app/data/mockData';

interface ReviewCardProps {
  review: Review;
  delay?: number;
}

export function ReviewCard({ review, delay = 0 }: ReviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center overflow-hidden flex-shrink-0">
          {review.customerAvatar ? (
            <img src={review.customerAvatar} alt={review.customerName} className="w-full h-full object-cover" />
          ) : (
            <span className="font-semibold text-blue-600">{review.customerName[0]}</span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-gray-900">{review.customerName}</h4>
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-gray-900">{review.rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
              {review.service}
            </span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(review.date).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed">{review.comment}</p>

          {review.images && review.images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {review.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Review ${idx + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-0.5 mt-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < review.rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
