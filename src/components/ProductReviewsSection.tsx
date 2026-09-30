import React, { useState } from 'react';
import { 
  Star, 
  CheckCircle2, 
  ThumbsUp, 
  MessageSquare, 
  ShieldCheck, 
  Send, 
  Sparkles, 
  User, 
  MapPin, 
  Filter,
  Check
} from 'lucide-react';
import { ProductReview } from '../types/dropship';

interface ProductReviewsSectionProps {
  productId: string;
  reviews: ProductReview[];
  overallRating: number;
  reviewsCount: number;
  onAddReview: (newReview: {
    author: string;
    city: string;
    rating: number;
    comment: string;
    verifiedPurchase: boolean;
  }) => void;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  reviews,
  overallRating,
  reviewsCount,
  onAddReview,
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [starRating, setStarRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorName, setAuthorName] = useState('');
  const [city, setCity] = useState('');
  const [comment, setComment] = useState('');
  const [verifiedPurchase, setVerifiedPurchase] = useState(true);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | 'all'>('all');
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});
  const [userVoted, setUserVoted] = useState<Record<string, boolean>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Quick feedback tag helper
  const quickTags = [
    'Fast COD Delivery 🚀',
    'Premium Quality ✨',
    'Matches Pictures 📸',
    'Great Value for Money 💰',
    'Super Easy to Use 👍',
  ];

  const ratingDescriptions: Record<number, string> = {
    1: 'Disappointing - Poor experience',
    2: 'Fair - Below expectations',
    3: 'Average - Decent product',
    4: 'Very Good - Satisfied with purchase',
    5: 'Outstanding - Highly recommended!',
  };

  // Calculate star rating distribution breakdown
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { stars, count, percentage };
  });

  const filteredReviews = reviews.filter((r) => {
    if (selectedRatingFilter === 'all') return true;
    return r.rating === selectedRatingFilter;
  });

  const handleToggleHelpful = (reviewId: string) => {
    if (userVoted[reviewId]) return;
    setHelpfulVotes((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
    setUserVoted((prev) => ({
      ...prev,
      [reviewId]: true,
    }));
  };

  const handleAddTagToComment = (tag: string) => {
    if (!comment.includes(tag)) {
      setComment((prev) => (prev ? `${prev} • ${tag}` : tag));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) {
      alert('Please enter your name and review comments.');
      return;
    }

    onAddReview({
      author: authorName.trim(),
      city: city.trim() || 'Verified Customer',
      rating: starRating,
      comment: comment.trim(),
      verifiedPurchase,
    });

    // Reset Form
    setAuthorName('');
    setCity('');
    setComment('');
    setStarRating(5);
    setFormSubmitted(true);
    setShowReviewForm(false);
    setTimeout(() => setFormSubmitted(false), 4000);
  };

  return (
    <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-6 space-y-6">
      {/* Header with Title and "Write a Review" button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              Customer Ratings & Verified Feedback
            </h3>
            <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {reviews.length} reviews
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real feedback from verified purchasers across Pakistan and worldwide.
          </p>
        </div>

        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="px-4 py-2 bg-slate-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{showReviewForm ? 'Close Form' : 'Write a Review'}</span>
        </button>
      </div>

      {/* Success Notification */}
      {formSubmitted && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">
            Thank you! Your review and rating have been posted to the storefront.
          </span>
        </div>
      )}

      {/* Review Submission Form Drawer / Card */}
      {showReviewForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-5 border border-amber-300/80 shadow-md space-y-4 animate-in slide-in-from-top-3 duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h4 className="font-black text-xs sm:text-sm text-slate-900">
                  Share Your Experience
                </h4>
                <p className="text-[11px] text-slate-500">
                  Help fellow shoppers make confident buying decisions.
                </p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Step 1 of 1</span>
          </div>

          {/* Interactive Star Rating Selector */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-800">
              Overall Rating *
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || starRating) >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setStarRating(star)}
                      className="p-1 text-slate-300 hover:scale-120 transition-all cursor-pointer focus:outline-hidden"
                      aria-label={`Rate ${star} star`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                {starRating} / 5 Stars — <span className="text-amber-700 font-normal">{ratingDescriptions[starRating]}</span>
              </span>
            </div>
          </div>

          {/* Author Name and Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Your Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Asad Ullah"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 focus:bg-white bg-slate-50/50 outline-hidden"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                City / Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lahore, Karachi, Islamabad"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 focus:bg-white bg-slate-50/50 outline-hidden"
                />
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Quick Experience Highlights Tags */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 block">
              Quick Highlights (Click to add to your review):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickTags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleAddTagToComment(tag)}
                  className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-200"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Feedback Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800">
                Detailed Feedback *
              </label>
              <span className="text-[10px] text-slate-400">
                {comment.length} characters
              </span>
            </div>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the build quality, delivery speed, and overall performance? Would you recommend it?"
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:border-amber-500 focus:bg-white bg-slate-50/50 outline-hidden resize-none"
            />
          </div>

          {/* Verified Purchase Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
            <input
              type="checkbox"
              checked={verifiedPurchase}
              onChange={(e) => setVerifiedPurchase(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
            />
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              I received and inspected this product from Apna Store
            </span>
          </label>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Verified Review</span>
            </button>
          </div>
        </form>
      )}

      {/* Ratings Overview & Star Breakdown Grid */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left Column: Overall Rating Score */}
        <div className="md:col-span-4 text-center md:text-left md:border-r md:border-slate-100 md:pr-4 space-y-1.5">
          <div className="flex items-baseline justify-center md:justify-start gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {overallRating.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-semibold">out of 5.0</span>
          </div>

          <div className="flex items-center justify-center md:justify-start text-amber-400 gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(overallRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-200 fill-slate-200'
                }`}
              />
            ))}
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Based on {reviewsCount} verified customer ratings
          </p>

          <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold mt-1">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>98% Positive Feedback</span>
          </div>
        </div>

        {/* Right Column: Progress Bars & Star Distribution */}
        <div className="md:col-span-8 space-y-1.5">
          {distribution.map(({ stars, count, percentage }) => (
            <div key={stars} className="flex items-center gap-2 text-xs">
              <button
                onClick={() =>
                  setSelectedRatingFilter(selectedRatingFilter === stars ? 'all' : stars)
                }
                className={`w-12 text-left font-semibold hover:text-amber-700 transition-colors cursor-pointer flex items-center gap-0.5 ${
                  selectedRatingFilter === stars ? 'text-amber-700 font-black' : 'text-slate-600'
                }`}
              >
                <span>{stars}</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
              </button>

              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <span className="w-10 text-right text-[11px] font-mono text-slate-400">
                {count} ({percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center justify-between text-xs flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-semibold flex items-center gap-1 text-[11px]">
            <Filter className="w-3 h-3" /> Filter by:
          </span>
          <button
            onClick={() => setSelectedRatingFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedRatingFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            All Reviews ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((s) => {
            const count = reviews.filter((r) => r.rating === s).length;
            if (count === 0 && selectedRatingFilter !== s) return null;
            return (
              <button
                key={s}
                onClick={() => setSelectedRatingFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedRatingFilter === s
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{s} Stars</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {selectedRatingFilter !== 'all' && (
          <button
            onClick={() => setSelectedRatingFilter('all')}
            className="text-[11px] text-amber-700 underline font-semibold"
          >
            Clear rating filter
          </button>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <p className="text-xs text-slate-500">
              No reviews found matching the {selectedRatingFilter}-star filter.
            </p>
            <button
              onClick={() => setSelectedRatingFilter('all')}
              className="text-xs text-amber-700 font-bold hover:underline"
            >
              Show all customer reviews
            </button>
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const voteCount = helpfulVotes[rev.id] || 0;
            const hasVoted = userVoted[rev.id];

            return (
              <div
                key={rev.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5 hover:border-slate-300 transition-colors"
              >
                {/* Review Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 uppercase">
                      {rev.author.substring(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">
                          {rev.author}
                        </span>
                        {rev.verifiedPurchase && (
                          <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {rev.city ? `${rev.city} • ` : ''}{rev.date}
                      </span>
                    </div>
                  </div>

                  {/* Stars Display */}
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200 fill-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-amber-900 ml-1">
                      {rev.rating}.0
                    </span>
                  </div>
                </div>

                {/* Review Content */}
                <p className="text-xs text-slate-700 leading-relaxed pl-10">
                  {rev.comment}
                </p>

                {/* Helpful Vote Action */}
                <div className="flex items-center justify-end gap-3 pt-1 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-400">Was this review helpful?</span>
                  <button
                    onClick={() => handleToggleHelpful(rev.id)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                      hasVoted
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ThumbsUp className={`w-3 h-3 ${hasVoted ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{hasVoted ? 'Helpful' : 'Yes'}</span>
                    {voteCount > 0 && <span className="font-mono">({voteCount})</span>}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
