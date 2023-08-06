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
  const [previousGames, setPreviousGames] = useState(null);

  const bsi_server = `${process.env.REACT_APP_BSI_SERVER_URL}:${process.env.REACT_APP_BSI_SERVER_PORT}`;

  // Load current games user is playing (game server will add the player name)
  useEffect(() => {
    if (auth?.token != null) {
      axios.get(`${bsi_server}/api/games/othello/`, {
        params: {
          winner: '',             // Only games with no winner yet
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
          visible: true,          // Only visible players
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

  // Load previous games user has played (game server will add the player name)
  useEffect(() => {
    if (auth?.token != null) {
      axios.get(`${bsi_server}/api/games/othello/`, {
        params: {
          winner: {'$gte': ' '},  // Only games with a winner
        }
      })
      .then((res) => {
        setPreviousGames(res.data);
      })
      .catch((err) => {
        console.log('Could not retrieve previous games ', err);
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

//   // Handle "Replay" click
//   const handleReplay = (e, opponent) => {
//     e.preventDefault();
// //    navigate('/newgame', {state: {'opponent': opponent}});
//   }

  return (
    <div>
      <h2>Dashboard for {username}</h2>
      <h3>Current Games</h3>
      {games == null ? <span>Loading games...</span> :
        <table className="dashboard highlight roundedbg">
          <thead>
            <tr>
              <th>Opponent</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {games.map((item) => {
              return (
                <tr key={item._id}>
                  <td>{item.players[0] !== username ? item.players[0] : item.players[1]}</td>
                  <td>{new Date(item.created).toLocaleString(undefined, {dateStyle: 'short', timeStyle: 'short'})}</td>
                  <td><button onClick={(e) => handleResume(e, item._id)}>Resume</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      }
      <h3>Roster</h3>
      {roster == null ? <span>Loading roster...</span> :
        <table className="dashboard highlight roundedbg">
          <thead>
            <tr>
              <th>Player</th>
              <th>Join Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {roster.map((item) => {
              return (
                <tr key={item._id}>
                  <td>{item.username}</td>
                  <td>{new Date(item.joindate).toLocaleString(undefined, {dateStyle: 'short', timeStyle: 'short'})}</td>
                  <td><button onClick={(e) => handleNewGame(e, item.username)}>New Game</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      }
      <h3>Previous Games</h3>
      {previousGames == null ? <span>Loading previous games...</span> :
        <table className="dashboard highlight roundedbg">
          <thead>
            <tr>
              <th>Opponent</th>
              <th>Game Date</th>
              <th>Winner</th>
            </tr>
          </thead>
          <tbody>
            {previousGames.map((item) => {
              return (
                <tr key={item._id}>
                  <td>{item.players[0] !== username ? item.players[0] : item.players[1]}</td>
                  <td>{new Date(item.created).toLocaleString(undefined, {dateStyle: 'short', timeStyle: 'short'})}</td>
                  <td>{item.winner}</td>
                  {/* <td><button onClick={(e) => handleReplay(e, item.username)}>Replay</button></td> */}
                </tr>
              );
            })}
          </tbody>
        </table>
      }
    </div>
  );
}
