import { AlertTriangle } from 'lucide-react';

interface ErrorMessageProps {
  message?: string;
  retry?: () => void;
}

export function ErrorMessage({ message = 'Something went wrong', retry }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 p-8 text-center text-red-400"
    >
      <AlertTriangle className="h-8 w-8" />
      <p>{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="mt-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-200 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
