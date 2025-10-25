'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { confessionsApi } from '@/lib/api/client';

// Comprehensive gender options
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'genderfluid', label: 'Genderfluid' },
  { value: 'agender', label: 'Agender' },
  { value: 'bigender', label: 'Bigender' },
  { value: 'demigender', label: 'Demigender' },
  { value: 'pangender', label: 'Pangender' },
  { value: 'genderqueer', label: 'Genderqueer' },
  { value: 'two-spirit', label: 'Two-Spirit' },
  { value: 'transgender', label: 'Transgender' },
  { value: 'questioning', label: 'Questioning' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

export default function SubmitForm() {
  const [formData, setFormData] = useState({
    gender: '',
    age: '',
    content: '',
    language: 'en',
    anonymous: true
  });
  const [socialMediaSettings, setSocialMediaSettings] = useState({
    shareToSocial: false,
    platforms: {
      facebook: false,
      instagram: false,
      twitter: false
    },
    generateImages: true,
    theme: 'dark',
    delayMinutes: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSocialMediaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name.startsWith('platform_')) {
      const platform = name.replace('platform_', '');
      setSocialMediaSettings(prev => ({
        ...prev,
        platforms: {
          ...prev.platforms,
          [platform]: checked
        }
      }));
    } else {
      setSocialMediaSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.content.trim()) {
      setError('Please enter your confession');
      return;
    }
    if (!formData.gender) {
      setError('Please select your gender');
      return;
    }
    if (!formData.age || parseInt(formData.age) < 13 || parseInt(formData.age) > 120) {
      setError('Please enter a valid age (13-120)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        gender: formData.gender,
        age: parseInt(formData.age),
        content: formData.content.trim(),
        language: formData.language || 'en',
        anonymous: formData.anonymous
      };

      const confession = await confessionsApi.create(payload);
      
      // Handle social media posting if enabled
      if (socialMediaSettings.shareToSocial) {
        const selectedPlatforms = Object.entries(socialMediaSettings.platforms)
          .filter(([_, enabled]) => enabled)
          .map(([platform, _]) => platform);
        
        if (selectedPlatforms.length > 0) {
          try {
            const socialResponse = await fetch(`/api/confessions/${confession.id}/post-to-social`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                platforms: selectedPlatforms,
                generate_images: socialMediaSettings.generateImages,
                theme: socialMediaSettings.theme,
                delay_minutes: socialMediaSettings.delayMinutes
              })
            });
            
            if (socialResponse.ok) {
              const socialData = await socialResponse.json();
              setSuccessData({
                confession,
                socialMedia: socialData
              });
            }
          } catch (socialErr) {
            console.error('Social media posting error:', socialErr);
            // Don't fail the whole submission for social media errors
          }
        }
      }

      if (!successData) {
        setSuccessData({ confession });
      }

      // Show success message for a moment, then redirect
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit confession. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Share Your Confession</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Gender Selection */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="">Select your gender</option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Age Input */}
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
            Age <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="age"
            name="age"
            min="13"
            max="120"
            value={formData.age}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your age"
            required
          />
        </div>

        {/* Confession Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Your Confession <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            name="content" 
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Share your thoughts anonymously..."
            value={formData.content}
            onChange={handleInputChange}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Your confession will be reviewed before being published.
          </p>
        </div>

        {/* Language Selection (Optional) */}
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
            Language (Optional)
          </label>
          <select
            id="language"
            name="language"
            value={formData.language}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="ru">Russian</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="ar">Arabic</option>
            <option value="hi">Hindi</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Anonymous Option */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="anonymous"
            name="anonymous"
            checked={formData.anonymous}
            onChange={handleInputChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700">
            Post anonymously (recommended)
          </label>
        </div>

        {/* Social Media Sharing Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">📱 Social Media Sharing</h3>
          
          {/* Enable Social Sharing */}
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="shareToSocial"
              name="shareToSocial"
              checked={socialMediaSettings.shareToSocial}
              onChange={handleSocialMediaChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="shareToSocial" className="ml-2 block text-sm text-gray-700">
              Share to social media platforms (optional)
            </label>
          </div>

          {socialMediaSettings.shareToSocial && (
            <div className="ml-6 space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Platforms:
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="platform_facebook"
                      name="platform_facebook"
                      checked={socialMediaSettings.platforms.facebook}
                      onChange={handleSocialMediaChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="platform_facebook" className="ml-2 text-sm text-gray-700">
                      📘 Facebook
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="platform_instagram"
                      name="platform_instagram"
                      checked={socialMediaSettings.platforms.instagram}
                      onChange={handleSocialMediaChange}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="platform_instagram" className="ml-2 text-sm text-gray-700">
                      📷 Instagram
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="platform_twitter"
                      name="platform_twitter"
                      checked={socialMediaSettings.platforms.twitter}
                      onChange={handleSocialMediaChange}
                      className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                    />
                    <label htmlFor="platform_twitter" className="ml-2 text-sm text-gray-700">
                      🐦 X (Twitter)
                    </label>
                  </div>
                </div>
              </div>

              {/* Image Generation Options */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="generateImages"
                  name="generateImages"
                  checked={socialMediaSettings.generateImages}
                  onChange={handleSocialMediaChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="generateImages" className="ml-2 text-sm text-gray-700">
                  Generate branded images for social media
                </label>
              </div>

              {/* Theme Selection */}
              {socialMediaSettings.generateImages && (
                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
                    Image Theme:
                  </label>
                  <select
                    id="theme"
                    name="theme"
                    value={socialMediaSettings.theme}
                    onChange={handleSocialMediaChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="dark">🌙 Dark Theme</option>
                    <option value="light">☀️ Light Theme</option>
                    <option value="gradient">🌈 Gradient Theme</option>
                  </select>
                </div>
              )}

              {/* Delay Options */}
              <div>
                <label htmlFor="delayMinutes" className="block text-sm font-medium text-gray-700 mb-1">
                  Posting Delay (minutes):
                </label>
                <select
                  id="delayMinutes"
                  name="delayMinutes"
                  value={socialMediaSettings.delayMinutes}
                  onChange={handleSocialMediaChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={0}>Post immediately</option>
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <p className="text-xs text-gray-500">
                ⚠️ Social media posting requires platform approval and may be subject to rate limits.
                Your confession will be posted from our official WhisperVault accounts.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {successData && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✅</span>
              <div>
                <p className="font-medium">Confession submitted successfully!</p>
                {successData.socialMedia && (
                  <p className="text-xs mt-1">
                    Social media posting scheduled for {successData.socialMedia.platforms?.join(', ')}
                  </p>
                )}
                <p className="text-xs mt-1">Redirecting to home page...</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting || successData}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || successData || !formData.content.trim() || !formData.gender || !formData.age}
            className="px-6 py-2"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                {socialMediaSettings.shareToSocial ? 'Publishing & Scheduling...' : 'Submitting...'}
              </span>
            ) : (
              'Submit Confession'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
