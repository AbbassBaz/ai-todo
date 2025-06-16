import React, { useState } from 'react';
import { Brain, Sparkles, Loader2 } from 'lucide-react';
import { AIService, AITaskSuggestion } from '../../services/ai';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';

export const AIHelper: React.FC = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AITaskSuggestion[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError('');
    setSuggestions([]);

    try {
      const taskSuggestions = await AIService.generateTasks(input);
      setSuggestions(taskSuggestions);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (suggestion: AITaskSuggestion) => {
    if (!user) return;

    try {
      const tasksRef = collection(db, `users/${user.uid}/tasks`);
      const taskDoc = await addDoc(tasksRef, {
        title: suggestion.title,
        description: suggestion.description || undefined,
        done: false,
        createdAt: new Date()
      });

      // Add subtasks if they exist
      if (suggestion.subtasks && suggestion.subtasks.length > 0) {
        const subtasksRef = collection(db, `users/${user.uid}/tasks/${taskDoc.id}/subtasks`);
        
        for (const subtaskTitle of suggestion.subtasks) {
          await addDoc(subtasksRef, {
            title: subtaskTitle,
            done: false,
            createdAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error adding AI-generated task:', error);
    }
  };

  const handleAddAllTasks = async () => {
    setSuggestions([]);
    setInput('');
    for (const suggestion of suggestions) {
      await handleAddTask(suggestion);
    }
  };

  return (
    <div className="mb-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Task Assistant</h3>
          <p className="text-sm text-gray-600">Describe your goals and I'll create structured tasks for you</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200 bg-white/80"
            placeholder="Examples: 'Plan my week', 'Create a task to prepare slides with 3 subtasks', 'Help me organize my home office'"
            rows={3}
            disabled={loading}
          />
          <Sparkles className="absolute top-3 right-3 w-5 h-5 text-purple-400" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-indigo-700 focus:ring-4 focus:ring-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Tasks
              </div>
            )}
          </button>
        </div>
      </form>

      {suggestions.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold text-gray-900">AI Generated Tasks</h4>
            <button
              onClick={handleAddAllTasks}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm font-medium"
            >
              Add All Tasks
            </button>
          </div>
          
          {suggestions.map((suggestion, index) => (
            <div key={index} className="bg-white/80 rounded-xl border border-purple-100 p-4">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-semibold text-gray-900">{suggestion.title}</h5>
                <button
                  onClick={() => handleAddTask(suggestion)}
                  className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 text-sm"
                >
                  Add
                </button>
              </div>
              
              {suggestion.description && (
                <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
              )}
              
              {suggestion.subtasks && suggestion.subtasks.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Subtasks:</p>
                  <ul className="space-y-1">
                    {suggestion.subtasks.map((subtask, subIndex) => (
                      <li key={subIndex} className="text-sm text-gray-700 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                        {subtask}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};