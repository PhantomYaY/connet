import React, { useState } from 'react';
import '../styles/form.css';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Form() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const toggleMode = () => {
    setIsLogin(prev => !prev);
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Logged in!');
        navigate('/dashboard');
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
        alert('Signed up!');
        navigate('/dashboard');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="form-component">
      <div className="toggle-container">
        <span className={`label ${isLogin ? 'active' : ''}`}>Log in</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={!isLogin}
            onChange={toggleMode}
            aria-label="Toggle between Log in and Sign up"
          />
          <span className="slider" />
        </label>
        <span className={`label ${!isLogin ? 'active' : ''}`}>Sign up</span>
      </div>

      <div className={`card-container ${!isLogin ? 'flipped' : ''}`}>
        <div className="card front">
          <h3 className="title">Log in</h3>
          <form className="form-fields" onSubmit={handleSubmit}>
            <input
              className="input"
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="button">Log in</button>
          </form>
        </div>

        <div className="card back">
          <h3 className="title">Sign up</h3>
          <form className="form-fields" onSubmit={handleSubmit}>
            <input
              className="input"
              type="text"
              placeholder="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="input"
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="button">Sign up</button>
          </form>
        </div>
      </div>
    </div>
  );
}
