import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Upload as UploadIcon, Camera, Image, X, Loader2 } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';

const mockBreeds = [
  {
    breed: 'Holstein Friesian',
    confidence: 98.2,
    status: 'Healthy' as const,
    crossbreed: { primary: { name: 'Holstein Friesian', percentage: 85 }, secondary: { name: 'Jersey', percentage: 15 } },
    health: { bodyCondition: 5, coatQuality: 'Excellent', diseases: [] },
    recommendations: {
      diet: ['High-energy concentrate feed', 'Fresh grass 40-50 kg/day', 'Protein supplements for lactation'],
      care: ['Daily milking routine', 'Regular veterinary check-ups', 'Proper ventilation in housing'],
      productivity: ['Expected milk yield: 25-35 liters/day', 'Peak lactation at 60-90 days', 'Calving interval: 12-13 months'],
    },
    breedInfo: {
      origin: 'Netherlands',
      primaryUse: 'Dairy',
      temperament: 'Calm, Productive',
      averageWeight: '600-700 kg',
      milkFat: '3.5-4.0%',
      climateAdaptability: 'Medium',
    },
  },
  {
    breed: 'Gir',
    confidence: 96.5,
    status: 'Healthy' as const,
    crossbreed: { primary: { name: 'Gir', percentage: 70 }, secondary: { name: 'Holstein', percentage: 30 } },
    health: { bodyCondition: 4, coatQuality: 'Good', diseases: [] },
    recommendations: {
      diet: ['High-protein feed (18-20% crude protein)', 'Fresh green fodder 25-30 kg/day', 'Mineral supplements (calcium, phosphorus)'],
      care: ['Regular deworming every 3 months', 'Hoof trimming every 6 months', 'Clean and dry shelter environment'],
      productivity: ['Expected milk yield: 15-20 liters/day', 'Optimal breeding age: 24-30 months', 'Lactation period: 300-305 days'],
    },
    breedInfo: {
      origin: 'India (Gujarat)',
      primaryUse: 'Dairy',
      temperament: 'Docile, Hardy',
      averageWeight: '400-500 kg',
      milkFat: '4.5-5.0%',
      climateAdaptability: 'High',
    },
  },
  {
    breed: 'Jersey',
    confidence: 94.8,
    status: 'Healthy' as const,
    crossbreed: { primary: { name: 'Jersey', percentage: 90 }, secondary: { name: 'Gir', percentage: 10 } },
    health: { bodyCondition: 4, coatQuality: 'Good', diseases: [] },
    recommendations: {
      diet: ['Balanced TMR (Total Mixed Ration)', 'Quality hay and silage', 'Adequate water supply (40-60 liters/day)'],
      care: ['Maintain hygiene during milking', 'Regular health monitoring', 'Comfortable bedding'],
      productivity: ['Expected milk yield: 18-22 liters/day', 'High butterfat content', 'Efficient feed converter'],
    },
    breedInfo: {
      origin: 'Jersey, Channel Islands',
      primaryUse: 'Dairy',
      temperament: 'Gentle, Alert',
      averageWeight: '350-450 kg',
      milkFat: '5.0-6.0%',
      climateAdaptability: 'High',
    },
  },
  {
    breed: 'Sahiwal',
    confidence: 95.3,
    status: 'Healthy' as const,
    crossbreed: { primary: { name: 'Sahiwal', percentage: 80 }, secondary: { name: 'Red Sindhi', percentage: 20 } },
    health: { bodyCondition: 4, coatQuality: 'Excellent', diseases: [] },
    recommendations: {
      diet: ['Green fodder 30-35 kg/day', 'Concentrate feed 3-4 kg/day', 'Clean drinking water'],
      care: ['Heat-tolerant breed, minimal cooling needed', 'Regular vaccination schedule', 'Parasite control'],
      productivity: ['Expected milk yield: 12-18 liters/day', 'Disease resistant', 'Long productive life'],
    },
    breedInfo: {
      origin: 'Pakistan/India',
      primaryUse: 'Dairy',
      temperament: 'Calm, Docile',
      averageWeight: '400-500 kg',
      milkFat: '4.5-5.5%',
      climateAdaptability: 'Very High',
    },
  },
];

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { addPrediction } = useApp();

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);

    // Simulate AI analysis stages
    setTimeout(() => setAnalysisStage('Preprocessing image...'), 200);
    setTimeout(() => setAnalysisStage('Detecting features...'), 800);
    setTimeout(() => setAnalysisStage('Identifying breed...'), 1400);
    setTimeout(() => setAnalysisStage('Analyzing health markers...'), 2000);

    setTimeout(() => {
      // Random breed selection for demo
      const mockBreed = mockBreeds[Math.floor(Math.random() * mockBreeds.length)];

      const now = new Date();
      const newPrediction = {
        id: Date.now().toString(),
        breed: mockBreed.breed,
        confidence: mockBreed.confidence + Math.random() * 2 - 1, // Slight variation
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0].substring(0, 5),
        status: mockBreed.status,
        image: preview || '🐄',
        crossbreed: mockBreed.crossbreed,
        health: mockBreed.health,
        recommendations: mockBreed.recommendations,
        breedInfo: mockBreed.breedInfo,
      };

      addPrediction(newPrediction);
      navigate(`/app/result/${newPrediction.id}`);
    }, 2500);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl mb-2 text-[var(--foreground)]">Upload Livestock Image</h2>
        <p className="text-[var(--muted-foreground)]">Upload an image to identify breed and analyze health</p>
      </div>

      <Card glass className="p-8">
        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="upload"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                isDragging
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-800/20 scale-105'
                  : 'border-[var(--border)] hover:border-green-300 hover:bg-green-50/30 dark:hover:bg-green-900/10'
              }`}
            >
              <div className="flex flex-col items-center">
                <motion.div
                  animate={isDragging ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                  transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
                  className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-green-500/30"
                >
                  <UploadIcon className="w-12 h-12" />
                </motion.div>
                <h3 className="text-xl mb-2 text-[var(--foreground)]">
                  {isDragging ? 'Drop image here' : 'Upload livestock image'}
                </h3>
                <p className="text-[var(--muted-foreground)] mb-6">Drag and drop or click to browse</p>
                <div className="flex gap-4">
                  <Button icon={<Image className="w-5 h-5" />} onClick={() => fileInputRef.current?.click()}>
                    Choose File
                  </Button>
                  <Button variant="outline" icon={<Camera className="w-5 h-5" />} onClick={() => fileInputRef.current?.click()}>
                    Take Photo
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  capture="environment"
                  className="hidden"
                />
                <p className="text-xs text-[var(--muted-foreground)] mt-6">Supported formats: JPG, PNG, WEBP (Max 10MB)</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key="preview"
              className="space-y-6"
            >
              <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img src={preview} alt="Preview" className="w-full h-96 object-contain" />
                <button
                  onClick={clearFile}
                  className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <Image className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm text-[var(--foreground)]">{selectedFile?.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button onClick={clearFile} className="text-sm text-[var(--destructive)] hover:underline">
                  Remove
                </button>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                icon={isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadIcon className="w-5 h-5" />}
              >
                {isAnalyzing ? 'Analyzing with AI...' : 'Analyze with AI'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {isAnalyzing && (
        <Card glass className="p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-green-200 dark:border-green-900 rounded-full"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <div>
              <h3 className="text-lg mb-2 text-[var(--foreground)]">AI Analysis in Progress</h3>
              <p className="text-sm text-[var(--muted-foreground)]">{analysisStage || 'Processing...'}</p>
            </div>
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-lg mb-4 text-[var(--foreground)]">Tips for Best Results</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
              ✓
            </div>
            <div>
              <h4 className="text-sm mb-1 text-[var(--foreground)]">Good Lighting</h4>
              <p className="text-xs text-[var(--muted-foreground)]">Ensure the animal is well-lit and clearly visible</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
              ✓
            </div>
            <div>
              <h4 className="text-sm mb-1 text-[var(--foreground)]">Clear Focus</h4>
              <p className="text-xs text-[var(--muted-foreground)]">Capture the full body or distinctive features</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
              ✓
            </div>
            <div>
              <h4 className="text-sm mb-1 text-[var(--foreground)]">Close Distance</h4>
              <p className="text-xs text-[var(--muted-foreground)]">Get close enough to see details clearly</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
              ✓
            </div>
            <div>
              <h4 className="text-sm mb-1 text-[var(--foreground)]">Side View</h4>
              <p className="text-xs text-[var(--muted-foreground)]">Side profile works best for breed identification</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}