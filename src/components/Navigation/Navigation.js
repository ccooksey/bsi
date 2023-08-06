//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthConsumer } from '../Authentication/useAuth';
import { BSIConsumer } from '../App/useBSI';
import '../App/App.css';

export default function Navigation() {

  const auth = AuthConsumer();
  const bsi = BSIConsumer();
  const navigate = useNavigate();

  // Sign out button support
  const handleSignOut = (() => {
    bsi.removePresence()
    .then(() => {
      console.log('User presence removed');
      auth.signout();
    })
    .then(() => {
      console.log('User has signed out');
      navigate('/');
    })
    .catch(() => {
      console.log('Authorization server offline. User still signed out.');
    });
  });

  return (
    <nav>
      {auth?.token == null && <span><Link to='/'>Sign In</Link><br/></span>}
      {auth?.token == null && <span><Link to='/register'>Register</Link><br/></span>}
      {auth?.token != null && <span><Link to='/dashboard'>Dashboard</Link><br/></span>}
      {auth?.token != null && <span><Link to='/preferences'>Preferences</Link><br/></span>}
      {auth?.token != null && <span><Link to='/introspect'>Introspect</Link><br/><br/></span>}
      {auth?.token != null && <button onClick={() => handleSignOut()}>Sign Out</button>}
    </nav>
  );
}
