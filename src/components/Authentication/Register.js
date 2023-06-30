//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthConsumer } from './useAuth';
import { bake_cookie, read_cookie } from 'sfcookies';
import '../App/AppCookieKeys';

export default function Register() {

  const auth = AuthConsumer();
  const navigate = useNavigate();

  const usernameValue = read_cookie(global.CookieKeys.reginame);
  const eaddressValue = read_cookie(global.CookieKeys.eaddress);
  const [user, setUser] = useState({
    username: usernameValue,
    eaddress: eaddressValue,
    password: '',
    confirmp: '',
  });
  const [attemptResult, setAttemptResult] = useState({});

  // Called everytime any field in the form changes
  const handleChange = (e) => {

    setUser((prevState) => ({...prevState, [e.target.name]: e.target.value}));

    if (e.target.name === 'username') {
      bake_cookie(global.CookieKeys.reginame, e.target.value);
    }
    if (e.target.name === 'eaddress') {
      bake_cookie(global.CookieKeys.eaddress, e.target.value);
    }
  }

  // Called when the form is submitted
  const handleSubmit = (e) => {

    // Do not actually submit the form. We do not want a callout to the
    // homepage -we are just using the form to collect the data.
    e.preventDefault();

    // Try the credentials. We will be setting the "isLoading" state which will
    // trigger a redraw to show the "loading" text in the jsx. Once the result has
    // been obtained, the "isLoading" state will revert to false and another redraw
    // will be triggered. The jsx looks at the attemptResult info to determine the
    // most useful message to display. If the attempt was successful the jsx will
    // display a success message and the code below will force a switch to the
    // sign in screen in a few seconds (nothing will prevent the user from
    // switching sooner). Note that we remember the new user name in the username
    // cookie and will show that on the signin screen.
    setAttemptResult({});
    auth.register(user.username, user.eaddress, user.password)
    .then((result) => {
        setAttemptResult(result);
        if (result.status === 'registered') {
          bake_cookie(global.CookieKeys.username, user.username);
            setTimeout(()=> {
            navigate('/signin');
          }, 4000);
        }
    })
    .catch((result) => {
      setAttemptResult(result);
      console.log('Authorization server offline. User was not registered.');
    });
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
      <label>
          <p>Username:</p>
          <input
            className="authentication-input-width"
            type="text"
            value={read_cookie(global.CookieKeys.reginame)}
            onChange={handleChange} 
            name="username"
            placeholder="Username" />
        </label>
        <label>
          <p>Email:</p>
          <input
            className="authentication-input-width"
            type="email"
            value={read_cookie(global.CookieKeys.eaddress)}
            onChange={handleChange} 
            name="eaddress"
            placeholder="Email" />
        </label>
        <label>
          <p>Password:</p>
          <input
            className="authentication-input-width"
            type="password"
            onChange={handleChange} 
            name="password"
            placeholder="Password" />
          <p className="password-problems">{user.password === "" && "* Password must not be empty"}</p>
        </label>
        <label>
          <p>Confirm password:</p>
          <input
            className="authentication-input-width"
            type="password"
            onChange={handleChange} 
            name="confirmp"
            placeholder="Confirm password" />
        </label>
        <p className="password-problems">{user.password !== user.confirmp && "* Passwords do not match"}</p>
        <div>
          <br/>
          <button type="submit" disabled={
            attemptResult?.status === "registered" ||
            user.password === "" ||
            user.password !== user.confirmp}>Register</button>
          <p>Back to <Link to="/signin">Sign In</Link></p>
        </div>
      </form>
      {!auth.isLoading && attemptResult?.status === "error" && <div className="signin-registration-issue">Registration failed.{attemptResult?.response?.message}</div>}
      {!auth.isLoading && attemptResult?.status === "duplicate" && <div className="signin-registration-issue">Registration failed. Duplicate user.</div>}
      {!auth.isLoading && attemptResult?.status === "registered" && <div className="signin-registration-success">Registration successful! Returning to sign in page.</div>}
      {auth.isLoading && <div className="signin-registration-loading">Registering new user...</div>}
    </div>
  )
}