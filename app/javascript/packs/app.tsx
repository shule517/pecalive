import React from "react";
import { BrowserRouter, Route, Link } from 'react-router-dom'
import styled from 'styled-components';
import { useState, useEffect } from 'react';
import Channel from './types/Channel'
import ChannelList from './components/ChannelList';
import ChannelPlayer from './components/ChannelPlayer';

const Logo = styled.img`
  height: 50px;
  width: 180px;
  padding-left: 7px;
`;

const App = () => {
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/v1/channels', {credentials: 'same-origin'});
      const response = await res.json() as Array<any>;

      const channels: any = response.map(channel => {
        const type = channel.contentType;
        if (type === null) { return null; }

        return {
          name: channel.name,                   // A.ch
          streamId: channel.channelId,          // 0C1A6C6959CEB2A8BF9598BC9185FF32
          tip: channel.tracker,                 // 14.13.42.64:5184
          contactUrl: channel.contactUrl,       // http://jbbs.shitaraba.net/bbs/read.cgi/game/52685/1567349533/
          genre: channel.genre,                 // PS4
          details: channel.description,         // モンスターハンターワールド：アイスボーン MHWIB - &lt;Open&gt;
          listenerCount: channel.listeners,     // -1
          relayCount: channel.relays,           // -1
          bitrate: channel.bitrate,             // 1500
          type: type,                           // FLV
          album: channel.album,
          comment: channel.comment,
          creator: channel.creator,
          trackTitle: channel.trackTitle,
          trackUrl: channel.trackUrl,
          uptime: channel.uptime,
          yellowPage: channel.yellowPage,
        } }
      );
      setChannels(channels);
    };

    fetchData();
  }, []);

  return (
    <BrowserRouter>
      <Link to='/'>
        <Logo src='/images/pecalive.png' />
      </Link>
      <div>
        <Route exact path='/' render={(props) => <ChannelList channels={channels} />} />
        <Route path='/channels/:streamId' render={
          (props) => { return <ChannelPlayer streamId={props.match.params.streamId} channels={channels}/>}
        }
        />
      </div>
    </BrowserRouter>
  )
};

export default App;