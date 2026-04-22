import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Prediction {
  id: string;
  breed: string;
  confidence: number;
  date: string;
  time: string;
  status: 'Healthy' | 'Warning' | 'Critical';
  image: string;
  crossbreed?: {
    primary: { name: string; percentage: number };
    secondary: { name: string; percentage: number };
  };
  health: {
    bodyCondition: number;
    coatQuality: string;
    diseases: string[];
  };
  recommendations: {
    diet: string[];
    care: string[];
    productivity: string[];
  };
  breedInfo: {
    origin: string;
    primaryUse: string;
    temperament: string;
    averageWeight: string;
    milkFat: string;
    climateAdaptability: string;
  };
}

interface User {
  name: string;
  email: string;
  role: 'Farmer' | 'Veterinarian' | 'Admin';
  avatar: string;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  predictions: Prediction[];
  addPrediction: (prediction: Prediction) => void;
  getPrediction: (id: string) => Prediction | undefined;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: string) => void;
  signup: (name: string, email: string, password: string, role: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mockPredictions: Prediction[] = [
  {
    id: '1',
    breed: 'Gir',
    confidence: 96.5,
    date: '2026-04-22',
    time: '14:30',
    status: 'Healthy',
    image: '🐄',
    crossbreed: {
      primary: { name: 'Gir', percentage: 70 },
      secondary: { name: 'Holstein', percentage: 30 },
    },
    health: {
      bodyCondition: 4,
      coatQuality: 'Good',
      diseases: [],
    },
    recommendations: {
      diet: [
        'High-protein feed (18-20% crude protein)',
        'Fresh green fodder 25-30 kg/day',
        'Mineral supplements (calcium, phosphorus)',
      ],
      care: [
        'Regular deworming every 3 months',
        'Hoof trimming every 6 months',
        'Clean and dry shelter environment',
      ],
      productivity: [
        'Expected milk yield: 15-20 liters/day',
        'Optimal breeding age: 24-30 months',
        'Lactation period: 300-305 days',
      ],
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
    id: '2',
    breed: 'Holstein Friesian',
    confidence: 98.2,
    date: '2026-04-21',
    time: '10:15',
    status: 'Healthy',
    image: '🐄',
    crossbreed: {
      primary: { name: 'Holstein Friesian', percentage: 85 },
      secondary: { name: 'Jersey', percentage: 15 },
    },
    health: {
      bodyCondition: 5,
      coatQuality: 'Excellent',
      diseases: [],
    },
    recommendations: {
      diet: [
        'High-energy concentrate feed',
        'Fresh grass 40-50 kg/day',
        'Protein supplements for lactation',
      ],
      care: [
        'Daily milking routine',
        'Regular veterinary check-ups',
        'Proper ventilation in housing',
      ],
      productivity: [
        'Expected milk yield: 25-35 liters/day',
        'Peak lactation at 60-90 days',
        'Calving interval: 12-13 months',
      ],
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
    id: '3',
    breed: 'Jersey',
    confidence: 94.8,
    date: '2026-04-20',
    time: '16:45',
    status: 'Warning',
    image: '🐄',
    crossbreed: {
      primary: { name: 'Jersey', percentage: 90 },
      secondary: { name: 'Gir', percentage: 10 },
    },
    health: {
      bodyCondition: 3,
      coatQuality: 'Fair',
      diseases: ['Possible mastitis - requires veterinary check'],
    },
    recommendations: {
      diet: [
        'Balanced TMR (Total Mixed Ration)',
        'Quality hay and silage',
        'Adequate water supply (40-60 liters/day)',
      ],
      care: [
        'Immediate veterinary consultation recommended',
        'Monitor udder health closely',
        'Maintain hygiene during milking',
      ],
      productivity: [
        'Expected milk yield: 18-22 liters/day',
        'High butterfat content',
        'Efficient feed converter',
      ],
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
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>(mockPredictions);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (email: string, password: string, role: string) => {
    const newUser: User = {
      name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      email,
      role: role as 'Farmer' | 'Veterinarian' | 'Admin',
      avatar: role === 'Farmer' ? '👨‍🌾' : role === 'Veterinarian' ? '👨‍⚕️' : '👨‍💼',
    };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('isAuthenticated', 'true');
  };

  const signup = (name: string, email: string, password: string, role: string) => {
    const newUser: User = {
      name,
      email,
      role: role as 'Farmer' | 'Veterinarian' | 'Admin',
      avatar: role === 'Farmer' ? '👨‍🌾' : role === 'Veterinarian' ? '👨‍⚕️' : '👨‍💼',
    };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('isAuthenticated', 'true');
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  };

  const addPrediction = (prediction: Prediction) => {
    setPredictions([prediction, ...predictions]);
  };

  const getPrediction = (id: string) => {
    return predictions.find((p) => p.id === id);
  };

  // Load user from localStorage on mount
  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedAuth = localStorage.getItem('isAuthenticated');
    if (savedUser && savedAuth === 'true') {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        predictions,
        addPrediction,
        getPrediction,
        isAuthenticated,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
