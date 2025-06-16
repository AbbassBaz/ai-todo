import React, { useState, useEffect } from 'react';
import { Task } from '../../types';
import { TaskCard } from './TaskCard';
import { AddTaskForm } from './AddTaskForm';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, Clock, Calendar } from 'lucide-react';

export const TaskList: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const tasksRef = collection(db, `users/${user.uid}/tasks`);
    const q = query(tasksRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Task[];
      setTasks(tasksData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;

    try {
      const taskRef = doc(db, `users/${user.uid}/tasks/${taskId}`);
      await updateDoc(taskRef, updates);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;

    try {
      const taskRef = doc(db, `users/${user.uid}/tasks/${taskId}`);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.done;
    if (filter === 'pending') return !task.done;
    return true;
  });

  const completedCount = tasks.filter(t => t.done).length;
  const pendingCount = tasks.filter(t => !t.done).length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tasks</h1>
            <p className="text-gray-600">Stay organized and productive</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-blue-50 rounded-xl px-4 py-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{pendingCount} pending</span>
            </div>
            <div className="bg-green-50 rounded-xl px-4 py-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">{completedCount} completed</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'All Tasks', count: tasks.length },
            { key: 'pending', label: 'Pending', count: pendingCount },
            { key: 'completed', label: 'Completed', count: completedCount },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                filter === key
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      <AddTaskForm />

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
            </h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'Create your first task to get started' 
                : `You don't have any ${filter} tasks right now`}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={handleUpdateTask}
              onDelete={handleDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
};