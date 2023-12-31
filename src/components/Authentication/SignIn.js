//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthConsumer } from './useAuth';
import { bake_cookie, read_cookie } from 'sfcookies';
import '../App/AppCookieKeys';

export default function SignIn() {

  const auth = AuthConsumer();
  const navigate = useNavigate();

  const username = read_cookie(global.CookieKeys.username);
  const [user, setUser] = useState({
    username: username,
    password: '',
  });
  const [attemptResult, setAttemptResult] = useState({});

  // Called every time any field in the form changes
  const handleChange = (e) => {
    if (e.target.name === 'username') {
      bake_cookie(global.CookieKeys.username, e.target.value);
    }
    setUser(prevState => ({...prevState, [e.target.name]: e.target.value}));
  }

  // Called when the form is submitted
  const handleSubmit = (e) => {

    // Do not actually submit the form. We do not want a callout to the
    // homepage -we are just using the form to collect the data.
    e.preventDefault();

    // Try the credentials. We will be setting the "isLoading" state which
    // will trigger a redraw to show the "loading" text in the jsx. Setting
    // the attemptResult will trigger another redraw and the jsx below will
    // display the results of the signin attempt. If it was successful the
    // code below will wait a moment then send us to a landing page.
    setAttemptResult({});
    auth.signin(user.username.toLowerCase(), user.password)
    .then((result) => {
      setAttemptResult(result);
      if (result.status === 'signedin') {
        setTimeout(() => { navigate('/dashboard'); }, 1000);
      }
    })
    .catch((result) => {
      setAttemptResult(result);
      console.log('Authorization server either offline or credentials are wrong.');
      });
    };

  return (
    <div>
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit}>
        <label>
          <p>Username:</p>
          <input
            className="authentication-input-width"
            type="text"
            value={read_cookie(global.CookieKeys.username)}
            onChange={handleChange} 
            name="username"
            placeholder="Username or email" />
        </label>
        <label>
          <p>Password:</p>
          <input
            className="authentication-input-width"
            type="password"
            onChange={handleChange} 
            name="password"
            placeholder="Password" />
        </label>
        <div>
          <br/>
          {attemptResult?.status !== "signedin" && <button type="submit">Sign In</button>}
          {attemptResult?.status !== "signedin" && <p>Or please <Link to="/register">Register</Link></p>}
        </div>
      </form>
      {!auth.isLoading && attemptResult?.status === "invalidcredentials" && <div className="signin-registration-issue">Username or password incorrect. Please try again.</div>}
      {!auth.isLoading && attemptResult?.status === "signedin" && <div className="signin-registration-success">Sign in successful.<br></br>Welcome {user.username}!</div>}
      {auth.isLoading && <div className="signin-registration-loading">Verifying credentials...</div>}
    </div>
  )
}
