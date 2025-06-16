import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Edit2, 
  Trash2, 
  Plus, 
  X, 
  ChevronDown, 
  ChevronRight,
  Calendar
} from 'lucide-react';
import { Task, Subtask } from '../../types';
import { SubtaskItem } from './SubtaskItem';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';

interface TaskCardProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const subtasksRef = collection(db, `users/${user.uid}/tasks/${task.id}/subtasks`);
    const q = query(subtasksRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subtasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subtask[];
      setSubtasks(subtasksData);
    });

    return unsubscribe;
  }, [task.id, user]);

  const handleSave = () => {
    if (editTitle.trim()) {
      onUpdate(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsEditing(false);
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || !user) return;

    setLoading(true);
    try {
      const subtasksRef = collection(db, `users/${user.uid}/tasks/${task.id}/subtasks`);
      await addDoc(subtasksRef, {
        title: newSubtask.trim(),
        done: false,
        createdAt: new Date()
      });
      setNewSubtask('');
    } catch (error) {
      console.error('Error adding subtask:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubtaskToggle = async (subtaskId: string, done: boolean) => {
    if (!user) return;

    try {
      const subtaskRef = doc(db, `users/${user.uid}/tasks/${task.id}/subtasks/${subtaskId}`);
      await updateDoc(subtaskRef, { done });
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const handleSubtaskUpdate = async (subtaskId: string, title: string) => {
    if (!user) return;

    try {
      const subtaskRef = doc(db, `users/${user.uid}/tasks/${task.id}/subtasks/${subtaskId}`);
      await updateDoc(subtaskRef, { title });
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const handleSubtaskDelete = async (subtaskId: string) => {
    if (!user) return;

    try {
      const subtaskRef = doc(db, `users/${user.uid}/tasks/${task.id}/subtasks/${subtaskId}`);
      await deleteDoc(subtaskRef);
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const completedSubtasks = subtasks.filter(s => s.done).length;
  const totalSubtasks = subtasks.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => onUpdate(task.id, { done: !task.done })}
            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 mt-1 ${
              task.done
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {task.done && <Check className="w-4 h-4" />}
          </button>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-lg font-semibold border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Task title"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Add description (optional)"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-lg font-semibold transition-all duration-200 ${
                    task.done ? 'text-gray-500 line-through' : 'text-gray-800'
                  }`}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(task.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {task.description && (
                  <p className={`text-sm mb-3 transition-all duration-200 ${
                    task.done ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {task.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(task.createdAt).toLocaleDateString()}
                  </div>
                  {totalSubtasks > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-100 rounded-full px-2 py-1">
                        {completedSubtasks}/{totalSubtasks} completed
                      </div>
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {totalSubtasks > 0 && (
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {(isExpanded || totalSubtasks === 0) && (
          <div className="mt-4 pl-10 space-y-3">
            {subtasks.map((subtask) => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                onToggle={handleSubtaskToggle}
                onUpdate={handleSubtaskUpdate}
                onDelete={handleSubtaskDelete}
              />
            ))}

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a subtask..."
              />
              <button
                onClick={handleAddSubtask}
                disabled={loading || !newSubtask.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};