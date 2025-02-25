import React from 'react';
import { Heart, MessageCircle, Youtube, Github, Twitter } from 'lucide-react';

const CommunityPage = () => {
  return (
    <div className="bg-gray-800 min-h-screen">
      <div className="container mx-auto p-4">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <img 
              src="/api/placeholder/40/40" 
              alt="ARA logo with three interconnected circles in teal color" 
              className="h-10"
            />
            <div className="flex space-x-1">
              <Youtube className="text-red-500 w-5 h-5" />
              {/* Discord icon simulated with text since Lucide doesn't have a direct Discord icon */}
              <div className="text-indigo-400 text-xl font-bold">D</div>
              <Github className="text-white w-5 h-5" />
              <Twitter className="text-blue-400 w-5 h-5" />
            </div>
          </div>
          <div className="bg-pink-500 text-white px-4 py-2 rounded">
            Exclusive Early Adoper Version !
          </div>
        </div>

        {/* Content Card */}
        <div className="relative w-64">
          <div className="absolute -top-4 left-2 z-10 flex items-center space-x-1">
            <span className="text-white">3</span>
            <Heart className="text-white w-4 h-4" />
          </div>
          <div className="absolute -top-4 left-12 z-10 flex items-center space-x-1">
            <span className="text-white">3</span>
            <MessageCircle className="text-white w-4 h-4" />
          </div>
          <div className="relative">
            <img 
              src="/api/placeholder/256/144" 
              alt="Rural landscape with mountains in the background and a person performing a skateboard trick in the foreground" 
              className="rounded-lg"
            />
            <div className="absolute bottom-2 left-2 text-white text-sm">
              Booklike
            </div>
          </div>
        </div>

        {/* Create New Community Button */}
        <div className="mt-80 flex justify-center">
          <button className="bg-yellow-600 text-white px-6 py-3 rounded">
            Create New Community
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;