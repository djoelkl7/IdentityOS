/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Info, 
  Zap, 
  Shield, 
  User, 
  Activity,
  Loader2,
  RefreshCw,
  Sun,
  CheckCircle2,
  XCircle,
  Heart,
  Sparkle,
  Bookmark,
  History,
  Trash2,
  Save,
  ArrowLeft,
  PenTool,
  Type as TypeIcon,
  Quote,
  Target,
  Wand2,
  Palette,
  Image as ImageIcon,
  Droplets,
  Cloud,
  Fingerprint,
  Shapes,
  Compass,
  Layers,
  Megaphone,
  Hash,
  MessageSquare,
  Layout,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  ListChecks,
  Rocket
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import Markdown from 'react-markdown';
import { BodyGraph, MandalaWheel } from "./components/HumanDesignVisuals";

// --- Types ---

interface HumanDesignResult {
  type: string;
  authority: string;
  profile: string;
  centers: Record<string, { defined: boolean; description: string }>;
  channels: { name: string; description: string }[];
  gates: { number: number; name: string; description: string }[];
  summary: string;
  metadata?: {
    birthDate: string;
    birthTime: string;
    birthLocation: string;
    savedAt: string;
  };
}

interface DailyReading {
  theme: string;
  actions: string[];
  avoid: string[];
  affirmation: string;
  savedAt?: string;
}

interface VoiceAnalysis {
  adjectives: string[];
  tone: string;
  strengths: string[];
  archetype: string;
  sampleCaption: string;
}

interface AuraAnalysis {
  palette: { hex: string; usage: string }[];
  mood: string;
}

interface LogoConcept {
  name: string;
  description: string;
  shapes: string[];
  colors: { name: string; hex: string }[];
}

interface ContentGeneration {
  captions: string[];
  hashtags: string[];
  cta: string;
  flyerText?: string;
}

interface BusinessAlignment {
  weeklyFocus: string;
  opportunities: string[];
  challenges: string[];
  actionSteps: string[];
  motivation: string;
}

// --- Components ---

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl", className)}>
    {children}
  </div>
);

const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "outline" }) => (
  <span className={cn(
    "px-3 py-1 rounded-full text-xs font-medium",
    variant === "default" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "border border-white/20 text-white/70"
  )}>
    {children}
  </span>
);

export default function App() {
  const [loading, setLoading] = useState(false);
  const [generatingDaily, setGeneratingDaily] = useState(false);
  const [result, setResult] = useState<HumanDesignResult | null>(null);
  const [dailyReading, setDailyReading] = useState<DailyReading | null>(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysis | null>(null);
  const [auraAnalysis, setAuraAnalysis] = useState<AuraAnalysis | null>(null);
  const [logoConcepts, setLogoConcepts] = useState<LogoConcept[] | null>(null);
  const [contentResult, setContentResult] = useState<ContentGeneration | null>(null);
  const [businessResult, setBusinessResult] = useState<BusinessAlignment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'saved' | 'voice' | 'aura' | 'logos' | 'content' | 'business'>('home');
  const [analyzingVoice, setAnalyzingVoice] = useState(false);
  const [analyzingAura, setAnalyzingAura] = useState(false);
  const [generatingLogos, setGeneratingLogos] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatingBusiness, setGeneratingBusiness] = useState(false);
  const [writingSample, setWritingSample] = useState('');
  const [auraImage, setAuraImage] = useState<string | null>(null);
  const [businessGoals, setBusinessGoals] = useState('');
  const [contentInputs, setContentInputs] = useState({
    platform: 'Instagram',
    idea: '',
    voice: ''
  });
  const [savedBlueprints, setSavedBlueprints] = useState<HumanDesignResult[]>([]);
  const [savedReadings, setSavedReadings] = useState<DailyReading[]>([]);

  // Load saved data on mount
  React.useEffect(() => {
    const blueprints = localStorage.getItem('identityos_blueprints');
    const readings = localStorage.getItem('identityos_readings');
    if (blueprints) setSavedBlueprints(JSON.parse(blueprints));
    if (readings) setSavedReadings(JSON.parse(readings));
  }, []);

  const saveBlueprints = (newBlueprints: HumanDesignResult[]) => {
    setSavedBlueprints(newBlueprints);
    localStorage.setItem('identityos_blueprints', JSON.stringify(newBlueprints));
  };

  const saveReadings = (newReadings: DailyReading[]) => {
    setSavedReadings(newReadings);
    localStorage.setItem('identityos_readings', JSON.stringify(newReadings));
  };

  const handleSaveBlueprint = () => {
    if (!result) return;
    const newBlueprint = {
      ...result,
      metadata: {
        ...formData,
        savedAt: new Date().toISOString()
      }
    };
    const updated = [newBlueprint, ...savedBlueprints].slice(0, 10); // Keep last 10
    saveBlueprints(updated);
  };

  const handleSaveReading = () => {
    if (!dailyReading) return;
    const newReading = {
      ...dailyReading,
      savedAt: new Date().toISOString()
    };
    const updated = [newReading, ...savedReadings].slice(0, 10); // Keep last 10
    saveReadings(updated);
  };

  const handleDeleteBlueprint = (index: number) => {
    const updated = savedBlueprints.filter((_, i) => i !== index);
    saveBlueprints(updated);
  };

  const handleDeleteReading = (index: number) => {
    const updated = savedReadings.filter((_, i) => i !== index);
    saveReadings(updated);
  };

  const handleAnalyzeVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!writingSample.trim()) return;
    setAnalyzingVoice(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Analyze the following writing sample and determine the brand voice and identity.
      
      Writing Sample:
      "${writingSample}"
      
      Return a structured JSON response with:
      - adjectives: 3 adjectives describing the brand voice style
      - tone: A description of the tone
      - strengths: A list of writing strengths
      - archetype: A suggested brand personality archetype
      - sampleCaption: A short sample social media caption written in this exact voice
      
      Output format:
      {
        "adjectives": ["string", "string", "string"],
        "tone": "string",
        "strengths": ["string"],
        "archetype": "string",
        "sampleCaption": "string"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              adjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
              tone: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              archetype: { type: Type.STRING },
              sampleCaption: { type: Type.STRING }
            },
            required: ["adjectives", "tone", "strengths", "archetype", "sampleCaption"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setVoiceAnalysis(data);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze voice. Please try again.");
    } finally {
      setAnalyzingVoice(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAuraImage(reader.result as string);
        setAuraAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeAura = async () => {
    if (!auraImage) return;
    setAnalyzingAura(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Extract base64 data
      const base64Data = auraImage.split(',')[1];
      const mimeType = auraImage.split(',')[0].split(':')[1].split(';')[0];

      const prompt = `Analyze this image and extract its visual identity.
      
      Return a structured JSON response with:
      - palette: A 5-color palette. For each color, provide a hex code and a suggested usage (e.g., "Background", "Primary Action", "Accent").
      - mood: A description of the overall mood and aesthetic of the image.
      
      Output format:
      {
        "palette": [
          { "hex": "#string", "usage": "string" }
        ],
        "mood": "string"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              palette: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    hex: { type: Type.STRING },
                    usage: { type: Type.STRING }
                  }
                },
                minItems: 5,
                maxItems: 5
              },
              mood: { type: Type.STRING }
            },
            required: ["palette", "mood"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setAuraAnalysis(data);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze aura. Please try again.");
    } finally {
      setAnalyzingAura(false);
    }
  };

  const handleGenerateLogos = async () => {
    setGeneratingLogos(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Generate 3 distinct logo concepts for a brand called "IdentityOS".
      
      Themes:
      - Futuristic minimalism
      - Geometry
      - Identity + alignment themes
      
      Return a structured JSON response with an array of 3 concepts, each including:
      - name: Concept name
      - description: A detailed description of the concept's meaning
      - shapes: A breakdown of the geometric shapes used
      - colors: A list of suggested colors with names and hex codes
      
      Output format:
      {
        "concepts": [
          {
            "name": "string",
            "description": "string",
            "shapes": ["string"],
            "colors": [{ "name": "string", "hex": "#string" }]
          }
        ]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              concepts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    shapes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    colors: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          hex: { type: Type.STRING }
                        }
                      }
                    }
                  },
                  required: ["name", "description", "shapes", "colors"]
                },
                minItems: 3,
                maxItems: 3
              }
            },
            required: ["concepts"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setLogoConcepts(data.concepts);
    } catch (err) {
      console.error(err);
      setError("Failed to generate logo concepts. Please try again.");
    } finally {
      setGeneratingLogos(false);
    }
  };

  const handleGenerateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingContent(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Generate social media content for the following platform and idea, using the specified brand voice.
      
      Platform: ${contentInputs.platform}
      Idea/Product: ${contentInputs.idea}
      Brand Voice: ${contentInputs.voice || (voiceAnalysis ? voiceAnalysis.tone : 'Professional and engaging')}
      
      Return a structured JSON response with:
      - captions: 3 distinct caption options (short, medium, long)
      - hashtags: 10 relevant hashtags
      - cta: 1 strong call-to-action
      - flyerText: (optional) text for a promotional flyer or graphic
      
      Output format:
      {
        "captions": ["string", "string", "string"],
        "hashtags": ["string"],
        "cta": "string",
        "flyerText": "string"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              captions: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 3, maxItems: 3 },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 10, maxItems: 10 },
              cta: { type: Type.STRING },
              flyerText: { type: Type.STRING }
            },
            required: ["captions", "hashtags", "cta"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setContentResult(data);
    } catch (err) {
      console.error(err);
      setError("Failed to generate content. Please try again.");
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleGenerateBusinessAlignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !businessGoals.trim()) return;
    setGeneratingBusiness(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `As a Human Design Business Consultant, generate a weekly business alignment strategy.
      
      User's Human Design Chart:
      - Type: ${result.type}
      - Authority: ${result.authority}
      - Profile: ${result.profile}
      - Summary: ${result.summary}
      
      User's Business Goals:
      "${businessGoals}"
      
      Return a structured JSON response with:
      - weeklyFocus: A core theme for the week based on their energy type.
      - opportunities: 3 business opportunities aligned with their chart.
      - challenges: 3 potential energy challenges or pitfalls to watch out for.
      - actionSteps: 4 concrete action steps aligned with their strategy and authority.
      - motivation: A short, powerful motivational message.
      
      Output format:
      {
        "weeklyFocus": "string",
        "opportunities": ["string", "string", "string"],
        "challenges": ["string", "string", "string"],
        "actionSteps": ["string", "string", "string", "string"],
        "motivation": "string"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              weeklyFocus: { type: Type.STRING },
              opportunities: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 3, maxItems: 3 },
              challenges: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 3, maxItems: 3 },
              actionSteps: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
              motivation: { type: Type.STRING }
            },
            required: ["weeklyFocus", "opportunities", "challenges", "actionSteps", "motivation"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setBusinessResult(data);
    } catch (err) {
      console.error(err);
      setError("Failed to generate business alignment. Please try again.");
    } finally {
      setGeneratingBusiness(false);
    }
  };

  const [formData, setFormData] = useState({
    birthDate: '',
    birthTime: '',
    birthLocation: ''
  });

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `You are IdentityOS, an expert Human Design engine. 
      Calculate the Human Design chart for the following birth data:
      Date: ${formData.birthDate}
      Time: ${formData.birthTime}
      Location: ${formData.birthLocation}

      Return a structured JSON response. 
      Be accurate based on Human Design systems (Type, Authority, Profile, Centers, Channels, Gates).
      Provide a simple, insightful explanation for each element.
      
      The centers should include: Head, Ajna, Throat, G-Center, Heart, Spleen, Sacral, Solar Plexus, Root.
      
      Output format:
      {
        "type": "string",
        "authority": "string",
        "profile": "string",
        "centers": {
          "CenterName": { "defined": boolean, "description": "string" }
        },
        "channels": [
          { "name": "string", "description": "string" }
        ],
        "gates": [
          { "number": number, "name": "string", "description": "string" }
        ],
        "summary": "string (A holistic overview of this person's design)"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              authority: { type: Type.STRING },
              profile: { type: Type.STRING },
              centers: {
                type: Type.OBJECT,
                additionalProperties: {
                  type: Type.OBJECT,
                  properties: {
                    defined: { type: Type.BOOLEAN },
                    description: { type: Type.STRING }
                  }
                }
              },
              channels: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              },
              gates: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    number: { type: Type.NUMBER },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              },
              summary: { type: Type.STRING }
            },
            required: ["type", "authority", "profile", "centers", "channels", "gates", "summary"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setResult(data);
      setDailyReading(null); // Reset daily reading for new calculation
    } catch (err) {
      console.error(err);
      setError("Failed to calculate chart. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDailyReading = async () => {
    if (!result) return;
    setGeneratingDaily(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Using the user's Human Design chart, generate a daily energy reading for today (${new Date().toLocaleDateString()}).
      
      User Design:
      Type: ${result.type}
      Authority: ${result.authority}
      Profile: ${result.profile}
      Summary: ${result.summary}
      
      Include:
      - Energy theme of the day (1-2 sentences)
      - Recommended actions (3-4 points)
      - What to avoid (2-3 points)
      - A short affirmation (1 sentence)
      
      Tone: supportive, clear, aligned with Human Design principles.
      
      Output format:
      {
        "theme": "string",
        "actions": ["string"],
        "avoid": ["string"],
        "affirmation": "string"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              theme: { type: Type.STRING },
              actions: { type: Type.ARRAY, items: { type: Type.STRING } },
              avoid: { type: Type.ARRAY, items: { type: Type.STRING } },
              affirmation: { type: Type.STRING }
            },
            required: ["theme", "actions", "avoid", "affirmation"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setDailyReading(data);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingDaily(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex justify-center gap-4 mb-8">
            <button 
              onClick={() => setView('home')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                view === 'home' ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
              <Sparkles className="w-4 h-4" />
              Generator
            </button>
            <button 
              onClick={() => setView('saved')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                view === 'saved' ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
              <History className="w-4 h-4" />
              Saved Library
            </button>
            <button 
              onClick={() => setView('voice')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                view === 'voice' ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
              <PenTool className="w-4 h-4" />
              Voice Lab
            </button>
            <button 
              onClick={() => setView('aura')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                view === 'aura' ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
              <Palette className="w-4 h-4" />
              Aura Lab
            </button>
            <button 
              onClick={() => setView('logos')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                view === 'logos' ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
              <Shapes className="w-4 h-4" />
              Logo Lab
            </button>
            <button 
              onClick={() => setView('content')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                view === 'content' ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
              <Megaphone className="w-4 h-4" />
              Content Lab
            </button>
            <button 
              onClick={() => setView('business')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                view === 'business' ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
              <Briefcase className="w-4 h-4" />
              Business Lab
            </button>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-indigo-300 mb-6"
          >
            <Sparkles className="w-3 h-3" />
            <span>AI Human Design Engine</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-4"
          >
            Identity<span className="text-indigo-500">OS</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg max-w-xl mx-auto"
          >
            Decode your unique energetic blueprint. Enter your birth details to reveal your true nature.
          </motion.p>
        </header>

        {view === 'home' ? (
          !result ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="max-w-md mx-auto"
            >
              <Card className="p-8">
                <form onSubmit={handleCalculate} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      Birth Date
                    </label>
                    <input
                      required
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      Birth Time
                    </label>
                    <input
                      required
                      type="time"
                      value={formData.birthTime}
                      onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-400" />
                      Birth Location
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="City, Country"
                      value={formData.birthLocation}
                      onChange={(e) => setFormData({ ...formData, birthLocation: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white placeholder:text-slate-600"
                    />
                  </div>

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full group relative overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Calculating Blueprint...
                      </>
                    ) : (
                      <>
                        Generate Chart
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
                {error && (
                  <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
                )}
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {/* Action Bar */}
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => setResult(null)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Form
                </button>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleSaveBlueprint}
                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium"
                  >
                    <Save className="w-4 h-4" />
                    Save Blueprint
                  </button>
                  <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                    Blueprint Generated
                  </div>
                </div>
              </div>

              {/* Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="h-full flex flex-col items-center text-center justify-center py-10">
                    <User className="w-8 h-8 text-indigo-400 mb-4" />
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Type</h3>
                    <p className="text-2xl font-bold text-white">{result.type}</p>
                  </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="h-full flex flex-col items-center text-center justify-center py-10">
                    <Shield className="w-8 h-8 text-purple-400 mb-4" />
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Authority</h3>
                    <p className="text-2xl font-bold text-white">{result.authority}</p>
                  </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="h-full flex flex-col items-center text-center justify-center py-10">
                    <Activity className="w-8 h-8 text-blue-400 mb-4" />
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Profile</h3>
                    <p className="text-2xl font-bold text-white">{result.profile}</p>
                  </Card>
                </motion.div>
              </div>

              {/* Visual Representations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="p-8 flex flex-col items-center">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      BodyGraph
                    </h3>
                    <BodyGraph data={result} />
                    <p className="text-xs text-slate-500 mt-6 text-center">
                      Hover over centers and gates for detailed energetic insights.
                    </p>
                  </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                  <Card className="p-8 flex flex-col items-center">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Fingerprint className="w-5 h-5 text-indigo-400" />
                      Mandala Wheel
                    </h3>
                    <MandalaWheel data={result} />
                    <p className="text-xs text-slate-500 mt-6 text-center">
                      The 64 gates of the I-Ching mapped to your unique design.
                    </p>
                  </Card>
                </motion.div>
              </div>

              {/* Daily Alignment Section */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                {!dailyReading ? (
                  <Card className="border-dashed border-indigo-500/30 bg-indigo-500/5 flex flex-col items-center py-12">
                    <Sun className="w-12 h-12 text-indigo-400 mb-4 animate-pulse" />
                    <h3 className="text-xl font-bold text-white mb-2">Daily Alignment</h3>
                    <p className="text-slate-400 text-center max-w-sm mb-6">
                      Generate a personalized energy reading for today based on your unique design.
                    </p>
                    <button
                      onClick={handleGenerateDailyReading}
                      disabled={generatingDaily}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {generatingDaily ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Aligning...
                        </>
                      ) : (
                        <>
                          <Sparkle className="w-4 h-4" />
                          Get Today's Reading
                        </>
                      )}
                    </button>
                  </Card>
                ) : (
                  <Card className="border-indigo-500/30 bg-indigo-500/5 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 flex gap-2">
                      <button 
                        onClick={handleSaveReading}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-indigo-400 transition-all"
                        title="Save Reading"
                      >
                        <Bookmark className="w-5 h-5" />
                      </button>
                      <Sun className="w-24 h-24 text-indigo-500/10 -mr-8 -mt-8" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                          <Sun className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Daily Alignment: {new Date().toLocaleDateString()}</h3>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Energy Theme</h4>
                            <p className="text-slate-200 text-lg leading-relaxed">{dailyReading.theme}</p>
                          </div>
                          
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-3 text-pink-400">
                              <Heart className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase tracking-widest">Daily Affirmation</span>
                            </div>
                            <p className="text-white font-medium italic">"{dailyReading.affirmation}"</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-green-400 flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3" />
                              Recommended
                            </h4>
                            <ul className="space-y-2">
                              {dailyReading.actions.map((action, i) => (
                                <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                                  <span className="w-1 h-1 rounded-full bg-green-500/50 mt-2 shrink-0" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
                              <XCircle className="w-3 h-3" />
                              Avoid
                            </h4>
                            <ul className="space-y-2">
                              {dailyReading.avoid.map((item, i) => (
                                <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                                  <span className="w-1 h-1 rounded-full bg-red-500/50 mt-2 shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>

              {/* Summary */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="border-indigo-500/30 bg-indigo-500/5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                      <Info className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Holistic Summary</h3>
                      <div className="text-slate-300 leading-relaxed prose prose-invert max-w-none">
                        <Markdown>{result.summary}</Markdown>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Centers */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  Energy Centers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(result.centers).map(([name, data], idx) => (
                    <motion.div 
                      key={name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + (idx * 0.05) }}
                    >
                      <Card className={cn(
                        "p-5 transition-all hover:border-white/30",
                        data.defined ? "bg-indigo-500/10 border-indigo-500/40" : "bg-white/5"
                      )}>
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-white">{name}</span>
                          <Badge variant={data.defined ? "default" : "outline"}>
                            {data.defined ? "Defined" : "Undefined"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 leading-snug">{data.description}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Channels & Gates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">Active Channels</h3>
                  <div className="space-y-3">
                    {result.channels.map((channel, idx) => (
                      <Card key={idx} className="p-4 bg-white/5">
                        <h4 className="font-bold text-indigo-300 mb-1">{channel.name}</h4>
                        <p className="text-sm text-slate-400">{channel.description}</p>
                      </Card>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">Key Gates</h3>
                  <div className="space-y-3">
                    {result.gates.map((gate, idx) => (
                      <Card key={idx} className="p-4 bg-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono bg-white/10 px-1.5 py-0.5 rounded text-indigo-400">Gate {gate.number}</span>
                          <h4 className="font-bold text-slate-200">{gate.name}</h4>
                        </div>
                        <p className="text-sm text-slate-400">{gate.description}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        ) : view === 'voice' ? (
          <div className="max-w-4xl mx-auto space-y-12">
            <section className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-white">Voice Lab</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Paste a sample of your writing (emails, posts, articles) to decode your unique brand voice and personality archetype.
              </p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <form onSubmit={handleAnalyzeVoice} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Quote className="w-4 h-4 text-indigo-400" />
                        Writing Sample
                      </label>
                      <textarea
                        required
                        value={writingSample}
                        onChange={(e) => setWritingSample(e.target.value)}
                        placeholder="Paste your text here (at least 50 words for best results)..."
                        className="w-full h-64 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white placeholder:text-slate-600 resize-none text-sm"
                      />
                    </div>
                    <button
                      disabled={analyzingVoice || !writingSample.trim()}
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {analyzingVoice ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          Decode Voice
                        </>
                      )}
                    </button>
                  </form>
                </Card>
              </div>

              <div className="lg:col-span-3">
                <AnimatePresence mode="wait">
                  {!voiceAnalysis ? (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-2xl"
                    >
                      <TypeIcon className="w-12 h-12 text-slate-700 mb-4" />
                      <p className="text-slate-500">Your analysis will appear here once you provide a sample.</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="p-5 bg-indigo-500/5 border-indigo-500/20">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" />
                            Voice Style
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {voiceAnalysis.adjectives.map((adj, i) => (
                              <Badge key={i} variant="default">{adj}</Badge>
                            ))}
                          </div>
                        </Card>
                        <Card className="p-5 bg-purple-500/5 border-purple-500/20">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3 flex items-center gap-2">
                            <Target className="w-3 h-3" />
                            Archetype
                          </h4>
                          <p className="text-white font-bold">{voiceAnalysis.archetype}</p>
                        </Card>
                      </div>

                      <Card className="p-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Tone Description</h4>
                        <p className="text-slate-200 leading-relaxed">{voiceAnalysis.tone}</p>
                      </Card>

                      <Card className="p-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Writing Strengths</h4>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {voiceAnalysis.strengths.map((strength, i) => (
                            <li key={i} className="text-sm text-slate-400 flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3 text-green-500/50" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </Card>

                      <Card className="p-6 border-indigo-500/30 bg-indigo-500/5">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                          <Quote className="w-3 h-3" />
                          Sample Caption
                        </h4>
                        <p className="text-white italic leading-relaxed">
                          "{voiceAnalysis.sampleCaption}"
                        </p>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : view === 'aura' ? (
          <div className="max-w-4xl mx-auto space-y-12">
            <section className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-white">Aura Lab</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Upload an image to extract its unique color palette and energetic mood. Perfect for building a visual identity.
              </p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <Card className="p-0 overflow-hidden border-dashed border-2 border-white/10 bg-white/5 aspect-video flex flex-col items-center justify-center relative group">
                  {auraImage ? (
                    <>
                      <img src={auraImage} alt="Aura source" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg text-white text-sm font-medium hover:bg-white/30 transition-all">
                          Change Image
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-4 p-12 w-full h-full justify-center">
                      <ImageIcon className="w-12 h-12 text-slate-700" />
                      <div className="text-center">
                        <p className="text-slate-400 font-medium">Click to upload image</p>
                        <p className="text-slate-600 text-xs mt-1">PNG, JPG or WebP</p>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </Card>

                <button
                  disabled={analyzingAura || !auraImage}
                  onClick={handleAnalyzeAura}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {analyzingAura ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Extracting Aura...
                    </>
                  ) : (
                    <>
                      <Droplets className="w-5 h-5" />
                      Analyze Visual Identity
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-8">
                <AnimatePresence mode="wait">
                  {!auraAnalysis ? (
                    <motion.div 
                      key="empty-aura"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-2xl"
                    >
                      <Palette className="w-12 h-12 text-slate-700 mb-4" />
                      <p className="text-slate-500">Upload and analyze an image to see its color palette and mood.</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="aura-result"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-8"
                    >
                      <section className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <Droplets className="w-3 h-3" />
                          Color Palette
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {auraAnalysis.palette.map((color, i) => (
                            <motion.div 
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-center gap-4 group"
                            >
                              <div 
                                className="w-16 h-16 rounded-xl shadow-lg border border-white/10 shrink-0"
                                style={{ backgroundColor: color.hex }}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-white font-bold">{color.hex}</span>
                                  <button 
                                    onClick={() => navigator.clipboard.writeText(color.hex)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white"
                                  >
                                    <Bookmark className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{color.usage}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </section>

                      <section className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <Cloud className="w-3 h-3" />
                          Mood & Aesthetic
                        </h4>
                        <Card className="p-6 bg-indigo-500/5 border-indigo-500/20">
                          <p className="text-slate-200 leading-relaxed italic">
                            "{auraAnalysis.mood}"
                          </p>
                        </Card>
                      </section>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : view === 'logos' ? (
          <div className="max-w-5xl mx-auto space-y-12">
            <section className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-white">Logo Lab</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Generate geometric, futuristic logo concepts for IdentityOS that represent alignment and core identity.
              </p>
              <button
                disabled={generatingLogos}
                onClick={handleGenerateLogos}
                className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
              >
                {generatingLogos ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Concepts...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5" />
                    Generate 3 Concepts
                  </>
                )}
              </button>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="wait">
                {!logoConcepts ? (
                  <motion.div 
                    key="empty-logos"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="lg:col-span-3 flex flex-col items-center justify-center text-center p-24 border-2 border-dashed border-white/5 rounded-3xl"
                  >
                    <Shapes className="w-16 h-16 text-slate-800 mb-6" />
                    <p className="text-slate-500 text-lg">Click the button above to start the creative process.</p>
                  </motion.div>
                ) : (
                  logoConcepts.map((concept, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Card className="h-full flex flex-col p-6 hover:border-indigo-500/50 transition-all group">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                            <Compass className="w-5 h-5" />
                          </div>
                          <h3 className="text-xl font-bold text-white">{concept.name}</h3>
                        </div>
                        
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">
                          {concept.description}
                        </p>

                        <div className="space-y-6">
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                              <Shapes className="w-3 h-3" />
                              Shape Breakdown
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {concept.shapes.map((shape, j) => (
                                <span key={j} className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5">
                                  {shape}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                              <Palette className="w-3 h-3" />
                              Color Palette
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {concept.colors.map((color, j) => (
                                <div key={j} className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-full border border-white/10" 
                                    style={{ backgroundColor: color.hex }}
                                  />
                                  <span className="text-[10px] text-slate-400 font-mono">{color.hex}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : view === 'content' ? (
          <div className="max-w-6xl mx-auto space-y-12">
            <section className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-white">Content Lab</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Create high-converting social media content tailored to your platform and unique brand voice.
              </p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <Card className="p-6">
                  <form onSubmit={handleGenerateContent} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Platform</label>
                      <select 
                        value={contentInputs.platform}
                        onChange={(e) => setContentInputs({...contentInputs, platform: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                      >
                        <option value="Instagram">Instagram</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Twitter/X">Twitter/X</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Facebook">Facebook</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Product or Idea</label>
                      <textarea 
                        required
                        value={contentInputs.idea}
                        onChange={(e) => setContentInputs({...contentInputs, idea: e.target.value})}
                        placeholder="What are you promoting?"
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600 resize-none text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 flex justify-between">
                        Brand Voice
                        {voiceAnalysis && (
                          <button 
                            type="button"
                            onClick={() => setContentInputs({...contentInputs, voice: voiceAnalysis.tone})}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                          >
                            Use analyzed voice
                          </button>
                        )}
                      </label>
                      <textarea 
                        value={contentInputs.voice}
                        onChange={(e) => setContentInputs({...contentInputs, voice: e.target.value})}
                        placeholder={voiceAnalysis ? "Using your analyzed voice..." : "Describe your brand voice (e.g., Bold, Minimalist, Playful)"}
                        className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600 resize-none text-sm"
                      />
                    </div>

                    <button
                      disabled={generatingContent || !contentInputs.idea.trim()}
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {generatingContent ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5" />
                          Generate Content
                        </>
                      )}
                    </button>
                  </form>
                </Card>
              </div>

              <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                  {!contentResult ? (
                    <motion.div 
                      key="empty-content"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-3xl"
                    >
                      <Megaphone className="w-16 h-16 text-slate-800 mb-6" />
                      <p className="text-slate-500 text-lg">Enter your details to generate high-converting content.</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="content-result"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-8"
                    >
                      <section className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Caption Options
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          {contentResult.captions.map((caption, i) => (
                            <Card key={i} className="p-5 group relative">
                              <button 
                                onClick={() => navigator.clipboard.writeText(caption)}
                                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Bookmark className="w-4 h-4" />
                              </button>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 uppercase tracking-wider">
                                  Option {i + 1}
                                </span>
                              </div>
                              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{caption}</p>
                            </Card>
                          ))}
                        </div>
                      </section>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="space-y-4">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            Hashtags
                          </h3>
                          <Card className="p-5 bg-white/5">
                            <div className="flex flex-wrap gap-2">
                              {contentResult.hashtags.map((tag, i) => (
                                <span key={i} className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer">
                                  {tag.startsWith('#') ? tag : `#${tag}`}
                                </span>
                              ))}
                            </div>
                          </Card>
                        </section>

                        <section className="space-y-4">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Call to Action
                          </h3>
                          <Card className="p-5 border-indigo-500/30 bg-indigo-500/5">
                            <p className="text-white font-bold text-lg">{contentResult.cta}</p>
                          </Card>
                        </section>
                      </div>

                      {contentResult.flyerText && (
                        <section className="space-y-4">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Layout className="w-4 h-4" />
                            Flyer / Graphic Text
                          </h3>
                          <Card className="p-6 bg-purple-500/5 border-purple-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                              <Layout className="w-24 h-24" />
                            </div>
                            <p className="text-slate-200 leading-relaxed relative z-10 whitespace-pre-wrap italic">
                              {contentResult.flyerText}
                            </p>
                          </Card>
                        </section>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : view === 'business' ? (
          <div className="max-w-6xl mx-auto space-y-12">
            <section className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-white">Business Lab</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Align your business strategy with your unique energetic blueprint. Get weekly focus and action steps tailored to your Human Design.
              </p>
            </section>

            {!result ? (
              <Card className="p-12 text-center space-y-6 max-w-2xl mx-auto">
                <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400 w-16 h-16 flex items-center justify-center mx-auto">
                  <User className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Blueprint Required</h3>
                  <p className="text-slate-400">Please generate your Human Design blueprint first to access the Business Lab.</p>
                </div>
                <button 
                  onClick={() => setView('home')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2 rounded-xl transition-all"
                >
                  Go to Generator
                </button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                  <Card className="p-6">
                    <form onSubmit={handleGenerateBusinessAlignment} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                          <Rocket className="w-4 h-4 text-indigo-400" />
                          Business Goals
                        </label>
                        <textarea 
                          required
                          value={businessGoals}
                          onChange={(e) => setBusinessGoals(e.target.value)}
                          placeholder="What are you working on this week? (e.g., Launching a course, scaling sales, hiring...)"
                          className="w-full h-48 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600 resize-none text-sm"
                        />
                      </div>

                      <button
                        disabled={generatingBusiness || !businessGoals.trim()}
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {generatingBusiness ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Aligning Strategy...
                          </>
                        ) : (
                          <>
                            <Briefcase className="w-5 h-5" />
                            Generate Alignment
                          </>
                        )}
                      </button>
                    </form>
                  </Card>

                  <Card className="p-5 bg-indigo-500/5 border-indigo-500/20">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">Your Blueprint</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Type</span>
                        <span className="text-white font-medium">{result.type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Authority</span>
                        <span className="text-white font-medium">{result.authority}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="lg:col-span-8">
                  <AnimatePresence mode="wait">
                    {!businessResult ? (
                      <motion.div 
                        key="empty-business"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-3xl"
                      >
                        <Briefcase className="w-16 h-16 text-slate-800 mb-6" />
                        <p className="text-slate-500 text-lg">Enter your business goals to receive your aligned strategy.</p>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="business-result"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                      >
                        <Card className="p-6 border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp className="w-24 h-24" />
                          </div>
                          <div className="relative z-10">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Weekly Focus</h4>
                            <p className="text-2xl font-bold text-white leading-tight">{businessResult.weeklyFocus}</p>
                          </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <section className="space-y-4">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              Opportunities
                            </h4>
                            <div className="space-y-3">
                              {businessResult.opportunities.map((opt, i) => (
                                <Card key={i} className="p-4 bg-green-500/5 border-green-500/20">
                                  <p className="text-sm text-slate-200">{opt}</p>
                                </Card>
                              ))}
                            </div>
                          </section>

                          <section className="space-y-4">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Energy Challenges
                            </h4>
                            <div className="space-y-3">
                              {businessResult.challenges.map((challenge, i) => (
                                <Card key={i} className="p-4 bg-red-500/5 border-red-500/20">
                                  <p className="text-sm text-slate-200">{challenge}</p>
                                </Card>
                              ))}
                            </div>
                          </section>
                        </div>

                        <section className="space-y-4">
                          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <ListChecks className="w-4 h-4" />
                            Aligned Action Steps
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {businessResult.actionSteps.map((step, i) => (
                              <Card key={i} className="p-5 flex gap-4 items-start bg-white/5">
                                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                                  {i + 1}
                                </span>
                                <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
                              </Card>
                            ))}
                          </div>
                        </section>

                        <Card className="p-8 text-center bg-purple-500/5 border-purple-500/20">
                          <Quote className="w-8 h-8 text-purple-400 mx-auto mb-4 opacity-50" />
                          <p className="text-xl font-medium text-white italic leading-relaxed">
                            "{businessResult.motivation}"
                          </p>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Saved Blueprints */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bookmark className="w-6 h-6 text-indigo-400" />
                Saved Blueprints
              </h2>
              {savedBlueprints.length === 0 ? (
                <p className="text-slate-500 italic">No blueprints saved yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedBlueprints.map((bp, i) => (
                    <Card key={i} className="group relative">
                      <button 
                        onClick={() => handleDeleteBlueprint(i)}
                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="cursor-pointer" onClick={() => { setResult(bp); setView('home'); }}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">{bp.type}</h4>
                            <p className="text-xs text-slate-500">{bp.metadata?.birthLocation} • {new Date(bp.metadata?.savedAt || '').toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{bp.authority}</Badge>
                          <Badge variant="outline">{bp.profile}</Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Saved Readings */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Heart className="w-6 h-6 text-pink-400" />
                Favorite Readings
              </h2>
              {savedReadings.length === 0 ? (
                <p className="text-slate-500 italic">No readings saved yet.</p>
              ) : (
                <div className="space-y-4">
                  {savedReadings.map((rd, i) => (
                    <Card key={i} className="group relative">
                      <button 
                        onClick={() => handleDeleteReading(i)}
                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400 shrink-0">
                          <Sun className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">{new Date(rd.savedAt || '').toLocaleDateString()}</p>
                          <h4 className="font-bold text-white mb-2">{rd.theme}</h4>
                          <p className="text-sm text-slate-400 italic">"{rd.affirmation}"</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 text-center text-slate-500 text-sm border-t border-white/5 mt-20">
        <p>© 2026 IdentityOS Engine. All energetic blueprints are unique.</p>
      </footer>
    </div>
  );
}
