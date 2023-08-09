//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthConsumer } from '../Authentication/useAuth';
import { BSIConsumer } from '../App/useBSI';
import '../App/AppCookieKeys';
import '../App/App.css';

export default function NewGame() {

  const auth = AuthConsumer();
  const bsi = BSIConsumer();
  const navigate = useNavigate();
  const username = auth.username;

  const location = useLocation();
  const opponame = location?.state?.opponent;

  // This is just for rendering what the starting board will look like
  // on the new game screen. The game server will initialise any real games.
  const gameTemplate = [
    ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
    ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
    ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
    ['E', 'E', 'E', 'W', 'B', 'E', 'E', 'E',],
    ['E', 'E', 'E', 'B', 'W', 'E', 'E', 'E',],
    ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
    ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
    ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
  ];

  const [gameParameters, setGameParameters] = useState({
    opponent: opponame,
    usercolor: 'B'
  })

  const renderToken = (token) => {
    if (token==='E')
      return "";
    return (
      <svg width="100%" height="100%">
        <circle cx="50%" cy="50%" r="47%" stroke="grey" strokeWidth="1"
         fill={token==='W' ? "white" : "black"} />
      </svg>
    )
  }
  
  // Called when a starting player radio button is clicked
  const handlePlayerOneChange = (e) => {
    if (e.target.id === 'player1') {
      setGameParameters(prevState => ({...prevState, usercolor: 'B'}));
    } else {
      setGameParameters(prevState => ({...prevState, usercolor: 'W'}));
    }
  }

  const handleStartGame = (e) => {
    if (typeof e.cancelable !== "boolean" || e.cancelable) {
      e.preventDefault();
    }
    bsi.newGame(gameParameters)
    .then((res) => {
      if (res?.data?.id != null) {
        navigate('/play', {state: {id: res.data.id}});
      } else {
        // This should never happen but fallback 'gracefully' if it does.
        navigate('/dashboard');
      }
    })
    .catch((err) => {
      console.log('Could not save game: ', err);
    });
  } 

  return (
    <div>
      <h2>New Game</h2>
      <h3>{username} vs {opponame}</h3>
      <table className="othelloTable">
        <tbody>
          {gameTemplate.map((rows, y) => {
            return (
              <tr key={y}>
                {rows != null && rows.map((cells, x) => {
                  return (
                    <td key={x} className="token othello">
                      {renderToken(cells)}
                    </td>
                  )})
                }
              </tr>
            )}
          )}
        </tbody>
      </table>

      <form action="/action_page.php">
      <br/>
        <p>Who will move first?</p>
        <div>
          <input type="radio" onChange={handlePlayerOneChange} id="player1" defaultChecked={gameParameters.usercolor === 'B'}
            name="firstToMove" value="player1"></input>
          <label htmlFor="player1">{username}</label>
          <br/>
          <input type="radio" onChange={handlePlayerOneChange} id="player2" defaultChecked={gameParameters.usercolor === 'W'}
            name="firstToMove" value="player2"></input>
          <label htmlFor="player2">{opponame}</label>
          <br/>
          <br/>
        </div>
        <div>
        <button onClick={(e) => handleStartGame(e)}>Start Game</button>
        </div>
      </form>
    </div>
  );
}
