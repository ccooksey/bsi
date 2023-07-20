//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import '../App/App.css';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthConsumer } from '../Authentication/useAuth';

export default function Navigation() {

  const auth = AuthConsumer();
  const navigate = useNavigate();

  // Sign out button support
  const handleSignOut = (() => {
    auth.signout()
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
