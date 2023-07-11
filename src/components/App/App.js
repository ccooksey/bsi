//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { AuthProvider, AuthConsumer } from '../Authentication/useAuth';
import AppLayout from './AppLayout'
import Home from '../Home/Home';
import SignIn from '../Authentication/SignIn';
import Register from '../Authentication/Register';
import Dashboard from '../Dashboard/Dashboard';
import Play from '../Play/Play';
import Preferences from '../Preferences/Preferences';
import Introspect from '../Authentication/Introspect';

 // Wrap protected routes in this component. If the client has a valid token
 // it will allow navigation to protected pages. Note that any enforcement
 // in the client can be circumvented in the developer console so it does
 // not need to be particularly robust here. On the other hand, resources that
 // should only be seen by an authorized user must be served from a separate
 // protected resource server.
function RequireAuth({ children }) {

  const auth = AuthConsumer();
  return auth?.token !== null ? children : <Navigate to='/signin' replace />;
}

function App() {

  return (
    <div>
      <AuthProvider>
        <Router>
          <AppLayout>
              <Routes >
                <Route path="/"             element={<Home />} />
                <Route path="/signin"       element={<SignIn />} />
                <Route path="/register"     element={<Register />} />
                <Route path="/dashboard"    element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path="/play"         element={<RequireAuth><Play /></RequireAuth>} />
                <Route path="/preferences"  element={<RequireAuth><Preferences /></RequireAuth>} />
                <Route path="/introspect"   element={<RequireAuth><Introspect /></RequireAuth>} />
              </Routes>
          </AppLayout>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
