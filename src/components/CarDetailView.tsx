'use client';

import { useAuth } from '@/context/AuthContext';
import { fetchCarById, fetchCarReviews, submitReview, deleteReview, fetchFavorites, addFavorite, removeFavorite } from '@/lib/api';
import { Car, Review, ReviewStats } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface CarDetailViewProps {
  carId: string;
}

export function CarDetailView({ carId }: CarDetailViewProps) {
  const numericId = Number(carId);
  const { token, user, formatPrice } = useAuth();
  const router = useRouter();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Favorites state
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ average_rating: 0, total_reviews: 0 });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const apiHost = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    return base.replace(/\/api$/, '');
  }, []);

  const resolveImageUrl = useCallback(
    (src?: string | null) => {
      if (!src) {
        return '/placeholder-car.svg';
      }
      if (src.startsWith('http') || src.startsWith('data:')) {
        return src;
      }
      if (!apiHost) {
        return src;
      }
      return `${apiHost}${src.startsWith('/') ? src : `/${src}`}`;
    },
    [apiHost]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!Number.isFinite(numericId)) {
        setError('Invalid car identifier.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await fetchCarById(numericId, token);
        console.log('[CarDetailView] API response:', response);
        console.log('[CarDetailView] mediaGallery:', response.car?.mediaGallery);
        console.log('[CarDetailView] galleryImages:', response.car?.galleryImages);
        if (!response.success || !response.car) {
          throw new Error('Unable to load car');
        }
        if (!cancelled) {
          setCar(response.car);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Unable to load car';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [numericId, token]);

  // Fetch reviews for the car
  useEffect(() => {
    if (!Number.isFinite(numericId)) return;
    async function loadReviews() {
      try {
        const response = await fetchCarReviews(numericId);
        if (response.success) {
          setReviews(response.reviews || []);
          setReviewStats(response.stats || { average_rating: 0, total_reviews: 0 });
        }
      } catch (err) {
        console.warn('Failed to load reviews:', err);
      }
    }
    loadReviews();
  }, [numericId]);

  // Check favourite status
  useEffect(() => {
    if (!token || !Number.isFinite(numericId)) return;
    async function checkFav() {
      try {
        const response = await fetchFavorites(token);
        if (response.success && response.cars) {
          setIsFavorited(response.cars.some(c => c.id === numericId));
        }
      } catch (err) {
        console.warn('Failed to check favorites:', err);
      }
    }
    checkFav();
  }, [numericId, token]);

  const handleToggleFavorite = async () => {
    if (!token) return; // Should show auth prompt ideally
    setFavLoading(true);
    const wasFavorited = isFavorited;
    setIsFavorited(!wasFavorited); // Optimistic update
    
    try {
      if (wasFavorited) {
        await removeFavorite(numericId, token);
      } else {
        await addFavorite(numericId, token);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      setIsFavorited(wasFavorited); // Revert on error
    } finally {
      setFavLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setReviewError('Please sign in to submit a review');
      return;
    }
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      console.log('Submitting review:', { carId: numericId, rating: reviewRating, comment: reviewComment });
      const response = await submitReview(numericId, reviewRating, reviewComment, token);
      console.log('Review response:', response);
      if (response.success) {
        // Refresh reviews
        const refreshed = await fetchCarReviews(numericId);
        if (refreshed.success) {
          setReviews(refreshed.reviews || []);
          setReviewStats(refreshed.stats || { average_rating: 0, total_reviews: 0 });
        }
        setReviewComment('');
        setReviewRating(5);
        setShowReviewForm(false);
      } else {
        setReviewError(response.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Review submission error:', err);
      setReviewError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!token) return;
    try {
      const response = await deleteReview(reviewId, token);
      if (response.success) {
        const refreshed = await fetchCarReviews(numericId);
        if (refreshed.success) {
          setReviews(refreshed.reviews || []);
          setReviewStats(refreshed.stats || { average_rating: 0, total_reviews: 0 });
        }
      }
    } catch (err) {
      console.warn('Failed to delete review:', err);
    }
  };

  const userHasReview = useMemo(() => {
    if (!user) return false;
    return reviews.some((r) => r.user_id === user.id);
  }, [reviews, user]);

  const heroImage = car ? resolveImageUrl(car.image) : '/placeholder-car.svg';

  const gallery = useMemo(() => {
    if (!car) {
      return heroImage ? [heroImage] : ['/placeholder-car.svg'];
    }
    console.log('[Gallery] car.mediaGallery:', car.mediaGallery);
    console.log('[Gallery] car.galleryImages:', car.galleryImages);
    const mediaImages = (car.mediaGallery || [])
      .filter((entry) => entry.type === 'image' && entry.url)
      .map((entry) => resolveImageUrl(entry.url));
    console.log('[Gallery] mediaImages extracted:', mediaImages);
    const galleryImages = (car.galleryImages || []).map((url) => resolveImageUrl(url));
    console.log('[Gallery] galleryImages extracted:', galleryImages);
    const fallbackImages = (car.imageUrls || []).map((url) => resolveImageUrl(url));
    const combined = [
      ...mediaImages,
      ...galleryImages,
      ...fallbackImages,
      heroImage,
    ].filter(Boolean) as string[];
    console.log('[Gallery] combined before dedup:', combined);
    const deduped = Array.from(new Set(combined));
    console.log('[Gallery] final deduped:', deduped);
    if (car) {
      const synthetic = buildFallbackGallery(car, deduped);
      synthetic.forEach((url) => {
        if (!deduped.includes(url)) {
          deduped.push(url);
        }
      });
    }
    return deduped;
  }, [car, heroImage, resolveImageUrl]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  useEffect(() => {
    setActiveIndex(0);
    setFullscreenIndex(0);
  }, [gallery.length]);

  const activeImage = gallery[activeIndex] || heroImage;
  const hasMultipleImages = gallery.length > 1;

  // Helper to resolve video URLs (same as images but for videos)
  const resolveVideoUrl = useCallback(
    (src?: string | null) => {
      if (!src) return '';
      // External URLs or data URIs remain as-is
      if (src.startsWith('http') || src.startsWith('data:')) return src;
      // Local paths need API host prefix
      if (!apiHost) return src;
      return `${apiHost}${src.startsWith('/') ? src : `/${src}`}`;
    },
    [apiHost]
  );
  
  // Collect all video URLs from both videoUrl and mediaGallery
  const videoSources = useMemo(() => {
    if (!car) return [];
    console.log('[Videos] car.videoUrl:', car.videoUrl);
    console.log('[Videos] car.mediaGallery:', car.mediaGallery);
    const videos: string[] = [];
    if (car.videoUrl) videos.push(resolveVideoUrl(car.videoUrl));
    const mediaVideos = (car.mediaGallery || [])
      .filter((entry) => entry.type === 'video' && entry.url)
      .map((entry) => resolveVideoUrl(entry.url));
    console.log('[Videos] mediaVideos extracted:', mediaVideos);
    mediaVideos.forEach((v) => {
      if (v && !videos.includes(v)) videos.push(v);
    });
    console.log('[Videos] final videos:', videos);
    return videos.filter(Boolean);
  }, [car, resolveVideoUrl]);

  const descriptionText = useMemo(() => buildDescriptionCopy(car), [car]);

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setIsFullscreen(true);
  };

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      } else if (event.key === 'ArrowRight') {
        setFullscreenIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
      } else if (event.key === 'ArrowLeft') {
        setFullscreenIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gallery.length, isFullscreen]);

  const renderVideoEmbed = (url: string, index: number) => {
    if (!url) return null;
    const youtubeMatch = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]+)/i);
    if (youtubeMatch) {
      return (
        <iframe
          title={`car-video-${index}`}
          src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
          className="aspect-video h-auto w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    // Handle uploaded videos (mp4, webm, ogg, mov, etc.)
    if (/\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url) || url.includes('/uploads/')) {
      return (
        <video 
          controls 
          src={url} 
          className="aspect-video h-auto w-full rounded-2xl bg-black object-contain"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      );
    }
    return (
      <a href={url} target="_blank" rel="noreferrer" className="text-sky-500 underline">
        Watch video
      </a>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading car details...
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow">
          <p className="text-lg font-semibold text-slate-900">Unable to load this car</p>
          <p className="mt-2 text-sm text-slate-600">{error || 'The requested listing could not be found.'}</p>
          <button
            type="button"
            className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => router.back()}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <button
          type="button"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
          onClick={() => router.back()}
        >
          ← Back to listings
        </button>
        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="relative h-96 w-full overflow-hidden rounded-t-3xl">
              <img
                src={activeImage}
                alt={`${car.make} ${car.model}`}
                className="h-full w-full cursor-zoom-in object-cover"
                onClick={() => openFullscreen(activeIndex)}
              />
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow"
                onClick={() => openFullscreen(activeIndex)}
              >
                Full screen
              </button>
              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 text-slate-800 shadow"
                    onClick={() => setActiveIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 text-slate-800 shadow"
                    onClick={() => setActiveIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1))}
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            {hasMultipleImages && (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
                {gallery.map((url, index) => (
                  <button
                    key={`${url}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-16 w-16 overflow-hidden rounded-xl border ${index === activeIndex ? 'border-sky-500' : 'border-slate-200'}`}
                  >
                    <img src={url} alt={`Thumbnail ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-6 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm uppercase tracking-wide text-slate-400">Listing</p>
                  <h1 className="text-3xl font-bold text-slate-900">{car.make} {car.model}</h1>
                  <p className="text-lg text-slate-600">{car.year} • {car.specs?.trim}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  {!Number.isNaN(Number(car.price)) && (
                    <div className="text-right">
                      <p className="text-3xl font-bold text-emerald-600">
                        {formatPrice(car.price, car.currency)}
                      </p>
                    </div>
                  )}
                  {/* Heart / Favorite Button */}
                  <button 
                    onClick={handleToggleFavorite}
                    disabled={!token || favLoading}
                    className={`rounded-full p-3 transition ${
                      isFavorited 
                        ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' 
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                    } ${!token ? 'cursor-not-allowed opacity-50' : ''}`}
                    title={token ? (isFavorited ? 'Remove from favorites' : 'Add to favorites') : 'Sign in to favorite'}
                  >
                    <svg 
                      className={`h-6 w-6 ${isFavorited ? 'fill-current' : 'fill-none'}`} 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs uppercase text-slate-400">Rating</p>
                  <p className="text-3xl font-semibold text-slate-900">{car.rating ? car.rating.toFixed(1) : '—'}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs uppercase text-slate-400">Reviews</p>
                  <p className="text-3xl font-semibold text-slate-900">{car.reviews ?? '—'}</p>
                </div>
                {car.odometerKm ? (
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs uppercase text-slate-400">Odometer</p>
                    <p className="text-3xl font-semibold text-slate-900">{car.odometerKm.toLocaleString()} km</p>
                  </div>
                ) : null}
              </div>
              {descriptionText && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                  <p className="text-sm font-semibold text-slate-900">Description</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{descriptionText}</p>
                </div>
              )}
              {car.specs && (
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(car.specs).map(([key, value]) =>
                    value ? (
                      <div key={key} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">{camelToTitle(key)}:</span> {String(value)}
                      </div>
                    ) : null
                  )}
                </div>
              )}
              {videoSources.length > 0 && (
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {videoSources.length === 1 ? 'Video spotlight' : `Videos (${videoSources.length})`}
                  </p>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    {videoSources.map((videoUrl, idx) => (
                      <div key={idx} className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
                        {renderVideoEmbed(videoUrl, idx)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Reviews Section */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Reviews & Ratings</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`h-5 w-5 ${star <= Math.round(reviewStats.average_rating) ? 'text-yellow-400' : 'text-slate-200'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{reviewStats.average_rating.toFixed(1)}</span>
                      <span className="text-sm text-slate-500">({reviewStats.total_reviews} reviews)</span>
                    </div>
                  </div>
                  {token && !userHasReview && (
                    <button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                    >
                      Write a Review
                    </button>
                  )}
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Your Review</p>
                    <div className="mt-3">
                      <label className="block text-xs text-slate-500">Rating</label>
                      <div className="mt-1 flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none"
                          >
                            <svg
                              className={`h-8 w-8 transition ${star <= reviewRating ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs text-slate-500">Comment (optional)</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your thoughts about this car..."
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        rows={3}
                        maxLength={1000}
                      />
                    </div>
                    {reviewError && <p className="mt-2 text-sm text-red-600">{reviewError}</p>}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Reviews List */}
                {reviews.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">{review.user_name}</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-400' : 'text-slate-200'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {user && user.id === review.user_id && (
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              title="Delete review"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                        {review.comment && (
                          <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No reviews yet. Be the first to review this car!</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Seller actions</p>
              <p className="mt-2 text-sm text-slate-600">Ready to discuss this car? Reach out to the IntelliWheels concierge team.</p>
              <div className="mt-4 space-y-2">
                <button className="w-full rounded-2xl bg-sky-600 py-2 text-sm font-semibold text-white">Request callback</button>
                <button className="w-full rounded-2xl border border-slate-200 py-2 text-sm font-semibold text-slate-900">Add to watchlist</button>
                {car.owner_id ? (
                  <button
                    className="w-full rounded-2xl border border-slate-200 py-2 text-sm font-semibold text-slate-900"
                    onClick={() => router.push(`/dealers/${car.owner_id}`)}
                  >
                    Visit dealer page
                  </button>
                ) : null}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Listing metadata</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>Currency: {car.currency || 'AED'}</li>
                <li>Created: {car.created_at ? new Date(car.created_at).toLocaleDateString() : 'Recently added'}</li>
                {car.updated_at && <li>Updated: {new Date(car.updated_at).toLocaleDateString()}</li>}
                {car.owner_id && <li>Owner ID: {car.owner_id}</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 py-8">
          <button
            type="button"
            className="absolute right-6 top-6 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white backdrop-blur"
            onClick={() => setIsFullscreen(false)}
          >
            Close ✕
          </button>
          {gallery.length > 1 && (
            <button
              type="button"
              aria-label="Previous image"
              className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-2xl text-white"
              onClick={() => setFullscreenIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))}
            >
              ‹
            </button>
          )}
          <img
            src={gallery[fullscreenIndex]}
            alt={`Fullscreen ${fullscreenIndex + 1}`}
            className="max-h-[90vh] max-w-5xl rounded-3xl object-contain shadow-2xl"
          />
          {gallery.length > 1 && (
            <button
              type="button"
              aria-label="Next image"
              className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-2xl text-white"
              onClick={() => setFullscreenIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1))}
            >
              ›
            </button>
          )}
          {gallery.length > 1 && (
            <div className="absolute bottom-8 flex max-w-4xl gap-3 overflow-x-auto rounded-2xl bg-white/10 p-3">
              {gallery.map((url, index) => (
                <button
                  key={`${url}-fullscreen-${index}`}
                  type="button"
                  onClick={() => setFullscreenIndex(index)}
                  className={`h-16 w-16 overflow-hidden rounded-xl border ${index === fullscreenIndex ? 'border-white' : 'border-transparent opacity-70'}`}
                >
                  <img src={url} alt={`Fullscreen thumbnail ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function camelToTitle(value: string) {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase());
}

function buildDescriptionCopy(car: Car | null) {
  if (!car) return '';
  const explicit = car.description?.trim();
  if (explicit) {
    return explicit;
  }
  const segments: string[] = [];
  const displayYear = car.year ? `${car.year}` : 'recent';
  segments.push(`This ${displayYear} ${car.make} ${car.model} is fully profiled on IntelliWheels.`);
  if (car.specs) {
    const { bodyStyle, engine, horsepower, fuelEconomy } = car.specs;
    const specLines: string[] = [];
    if (bodyStyle) specLines.push(`${bodyStyle} body`);
    if (engine) specLines.push(engine);
    if (horsepower) specLines.push(`${horsepower} hp output`);
    if (fuelEconomy) specLines.push(`rated at ${fuelEconomy}`);
    if (specLines.length) {
      segments.push(`Highlights include ${specLines.join(', ')}.`);
    }
  }
  if (car.price) {
    // Use simple price format for description text
    const priceStr = car.price.toLocaleString();
    const currencyLabel = car.currency || 'JOD';
    segments.push(`Priced at ${priceStr} ${currencyLabel}, it is ready for viewing.`);
  }
  return segments.join(' ');
}

function buildFallbackGallery(car: Car | null, existing: string[]) {
  // Don't add fallback/stock images - only show actual uploaded images
  // Users want to see only their uploaded photos, not placeholder stock images
  return [];
}

function buildStockImageUrl(car: Car, angle: string) {
  if (!car.make || !car.model) {
    return '';
  }
  const params = new URLSearchParams({
    customer: 'img',
    make: car.make,
    modelFamily: car.model,
    modelRange: car.model,
    modelYear: String(car.year ?? new Date().getFullYear()),
    angle,
    zoomType: 'fullscreen',
    width: '1600',
  });
  return `https://cdn.imagin.studio/getImage?${params.toString()}`;
}
