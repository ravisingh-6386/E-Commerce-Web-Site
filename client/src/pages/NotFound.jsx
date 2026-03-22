import { Link } from 'react-router-dom';
import { Wrench, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in">
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <span className="text-[120px] font-black text-gray-100 dark:text-dark-700 leading-none select-none">
            404
          </span>
          <Wrench
            size={56}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-600 rotate-12"
          />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Part Not Found
        </h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          We couldn't find the page you're looking for. It may have been removed, renamed, or never existed in our inventory.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary">
            <Home size={18} /> Back to Home
          </Link>
          <button onClick={() => window.history.back()} className="btn-secondary">
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
