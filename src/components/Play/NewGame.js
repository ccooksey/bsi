//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthConsumer } from '../Authentication/useAuth';
import '../App/AppCookieKeys';
import '../App/App.css';

export default function NewGame() {

  const auth = AuthConsumer();
  const navigate = useNavigate();
  const username = auth.username;

  const location = useLocation();
  const opponent = location?.state?.opponent;

  const [game, setGame] = useState({
      created: new Date(),
      players: [username, opponent],
      colors: ['B', 'W'],
      gameState: [
        ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
        ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
        ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
        ['E', 'E', 'E', 'W', 'B', 'E', 'E', 'E',],
        ['E', 'E', 'E', 'B', 'W', 'E', 'E', 'E',],
        ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
        ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
        ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
      ],
      next: username,
      winner: '',
      history: [],
    });

  const bsi_server = `${process.env.REACT_APP_BSI_SERVER_URL}:${process.env.REACT_APP_BSI_SERVER_PORT}`;

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
    debugger;
    if (e.target.id === 'player1') {
      setGame(prevState => ({...prevState, 'colors': ['B', 'W'], 'next': game.players[0]}));
    } else {
      setGame(prevState => ({...prevState, 'colors': ['W', 'B'], 'next': game.players[1]}));
    }
  }

  const handleStartGame = (e) => {
    if (typeof e.cancelable !== "boolean" || e.cancelable) {
      e.preventDefault();
    }
    axios.post(`${bsi_server}/api/games/othello/`, game)
    .then((res) => {
      console.log('Game recorded');
      setTimeout(() => { navigate('/dashboard'); }, 1000);
    })
    .catch((err) => {
      console.log('Could not save game: ', err);
    });
  } 

  return (
    <div>
      <h2>New Game</h2>
      <h3>{game?.players[0]} vs {game?.players[1]}</h3>
      <table className="othelloTable">
        <tbody>
          {game?.gameState.map((rows, y) => {
            return (
              <tr key={y}>
                {rows != null && rows.map((cells, x) => {
                  return (
                    <td key={x} className="othelloCell">
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
        <input type="radio" onChange={handlePlayerOneChange} id="player1" defaultChecked={game.colors[0] === 'B'} 
          name="firstToMove" value="player1"></input>
        <label htmlFor="player1">{game?.players[0]}</label>
        <br/>
        <input type="radio" onChange={handlePlayerOneChange} id="player2" defaultChecked={game.colors[1] === 'B'} 
          name="firstToMove" value="player2"></input>
        <label htmlFor="player2">{game?.players[1]}</label>
        <br/>
        <br/>
        </div>
        <div>
        <button onClick={(e) => handleStartGame(e)}>Start Game</button>
        </div>
      </form>

      {/* <p>First: {game?.next}: {usercolor==="W" ? "White" : "Black"}</p> */}
      {/* <p>{response}</p> */}
    </div>
  );
}
