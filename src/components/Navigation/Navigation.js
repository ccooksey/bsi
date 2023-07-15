//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import '../App/App.css';
import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { AuthConsumer } from '../Authentication/useAuth';

export default function Navigation() {

  // Sign out button support
  const navigate = useNavigate();
  const auth = AuthConsumer();
  const handleSignOut = (() => {
    auth.signout()
    .then(() => {
      console.log('User has signed out');
      navigate('/signin');
    })
    .catch(() => {
      console.log('Authorization server offline. User still signed out.');
    });
  });

  return (
    <nav>
      <ul>
        <li>  <Link to='/'>Home</Link>                    </li>
        <li>  <Link to='/signin'>Sign In</Link>           </li>
        <li>  <Link to='/register'>Register</Link>        </li>
        <li>  <Link to='/dashboard'>Dashboard</Link>      </li>
        <li>  <Link to='/preferences'>Preferences</Link>  </li>
        <li>  <Link to='/introspect'>Introspect</Link>  </li>
      </ul>
      {auth?.token !== null && <button onClick={handleSignOut}>Sign Out</button>}
    </nav>
  );
}
