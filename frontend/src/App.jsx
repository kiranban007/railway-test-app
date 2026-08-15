import { useEffect, useState } from 'react';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  const loadTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Failed to load todos');
      setTodos(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHealth = async () => {
    try {
      const res = await fetch('/api/health');
      setHealth(await res.json());
    } catch {
      setHealth({ status: 'error', db: 'unreachable' });
    }
  };

  useEffect(() => {
    loadTodos();
    loadHealth();
  }, []);

  const addTodo = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const newTodo = await res.json();
      setTodos((prev) => [newTodo, ...prev]);
      setText('');
    }
  };

  const toggleTodo = async (id) => {
    const res = await fetch(`/api/todos/${id}`, { method: 'PATCH' });
    if (res.ok) {
      const updated = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
  };

  const deleteTodo = async (id) => {
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setTodos((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="app">
      <h1>Railway Test App</h1>
      <p className={`health ${health?.status === 'ok' ? 'ok' : 'bad'}`}>
        DB status: {health ? health.db : 'checking...'}
      </p>

      <form onSubmit={addTodo} className="add-form">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a todo..."
        />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={todo.done ? 'done' : ''}>
              <span onClick={() => toggleTodo(todo.id)}>{todo.text}</span>
              <button onClick={() => deleteTodo(todo.id)}>✕</button>
            </li>
          ))}
          {todos.length === 0 && <li className="empty">No todos yet.</li>}
        </ul>
      )}
    </div>
  );
}
