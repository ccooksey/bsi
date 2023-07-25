//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthConsumer } from '../Authentication/useAuth';
import '../App/AppCookieKeys';
import '../App/App.css';

export default function Dashboard() {

  const auth = AuthConsumer();
  const navigate = useNavigate();
  const username = auth.username;

  const [games, setGames] = useState(null);
  const [roster, setRoster] = useState(null);

  const bsi_server = `${process.env.REACT_APP_BSI_SERVER_URL}:${process.env.REACT_APP_BSI_SERVER_PORT}`;

  // Make sure the current username is in the bsi database
  // Ignore the result (note that the catch is not optional).
  useEffect(() => {
    if (auth?.token != null) {
      axios.post(`${bsi_server}/api/roster/`)
      .catch(() => {});
    }
  }, [auth.token, bsi_server]);

  // Load current games user is playing
  useEffect(() => {
    if (auth?.token != null) {
      axios.get(`${bsi_server}/api/games/othello/`, {
        params: {
          players: username,  // Only games in which user is a player
          winner: '',         // Only games with no winner yet
        }
      })
      .then((res) => {
        setGames(res.data);
      })
      .catch((err) => {
        console.log('Could not retrieve current games ', err);
      });
    }
  }, [username, auth?.token, bsi_server]);

  // Load opponent roster
  useEffect(() => {
    if (auth?.token != null) {
      axios.get(`${bsi_server}/api/roster`, {
        params: {
          visible: true,      // Only visible players
        }
      })
      .then((res)=> {
        setRoster(res.data);
      })
      .catch((err) => {
        console.log('Could not retrieve roster ', err);
      });
    }
  }, [username, auth?.token, bsi_server]);

  // Handle "Resume" click
  const handleResume = (e, _id) => {
    e.preventDefault();
    navigate('/play', {state: {id: _id}});
  }

  // Handle "New Game" click
  const handleNewGame = (e, opponent) => {
    e.preventDefault();
    navigate('/newgame', {state: {'opponent': opponent}});
  }

  return (
    <div>
      <h2>Current Games</h2>
      <p>Welcome {username}</p>
      {games == null ? <span>Loading games...</span> :
        <table className="currentGamesTable">
          <thead>
            <tr>
              <th className="currentGamesCell">Date</th>
              <th className="currentGamesCell">Opponent</th>
            </tr>
          </thead>
          <tbody>
            {games.map((item) => {
              return (
                <tr key={item._id}>
                  <td className="currentGamesCell">{new Date(item.created).toLocaleString()}</td>
                  <td className="currentGamesCell">{item.players[0] !== username ? item.players[0] : item.players[1]}</td>
                  <td className="currentGamesAction"><button onClick={(e) => handleResume(e, item._id)}>Resume</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      }
      <h2>Roster</h2>
      {roster == null ? <span>Loading roster...</span> :
        <table className="currentGamesTable">
          <thead>
            <tr>
              <th className="currentGamesCell">Player</th>
              <th className="currentGamesCell">Join Date</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((item) => {
              return (
                <tr key={item._id}>
                  <td className="currentGamesCell">{item.username}</td>
                  <td className="currentGamesCell">{new Date(item.joindate).toLocaleString()}</td>
                  <td className="currentGamesAction"><button onClick={(e) => handleNewGame(e, item.username)}>New Game</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      }
    </div>
  );
}
