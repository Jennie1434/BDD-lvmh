import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Home from './pages/Home';
import Advisors from './pages/Advisors';
import Reattribution from './pages/Reattribution';
import Messages from './pages/Messages';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Alerts from './pages/Alerts';
import './App.css';

function App() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="advisors" element={<Advisors />} />
          <Route path="reattribution" element={<Reattribution />} />
          <Route path="messages" element={<Messages />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
