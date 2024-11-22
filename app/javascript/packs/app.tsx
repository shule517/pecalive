import React, { useState, useEffect } from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'

import { isIOS, isMobile } from 'react-device-detect'
import ChannelList from './components/ChannelList'
import ChannelPlayer from './components/ChannelPlayer'
import PageViewTracker from './components/PageViewTracker'
import SideBar from './components/SideBar'
import PecaLiveAppBar from './components/PecaLiveAppBar'
import Drawer from '@material-ui/core/Drawer'
import CssBaseline from '@material-ui/core/CssBaseline'
const drawerWidth = 290
import { useDispatch } from 'react-redux'
import { updateChannels } from './modules/channelsModule'
import { updateFavorites } from './modules/favoritesModule'
import { updatePeerCast } from './modules/peercastModule'
import PeerCast from './types/PeerCast'
import firebase from './firebase'
import { updateUser } from './modules/userModule'

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    drawer: {
      [theme.breakpoints.up('sm')]: {
        width: isMobile ? window.parent.screen.width * 0.8 : drawerWidth,
        flexShrink: 0,
      },
    },
    drawerPaper: {
      width: isMobile ? window.parent.screen.width * 0.8 : drawerWidth,
    },
    toolbar: theme.mixins.toolbar,
  })
)

const App = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    // 初期値はクッキーから復帰
    updatePeerCast(
      dispatch,
      localStorage.getItem('pecaHost') || PeerCast.defaultHost,
      localStorage.getItem('pecaPortNo') || PeerCast.defaultPortNo
    )

    // 初回のチャンネル情報を取得
    updateChannels(dispatch)
    updateFavorites(dispatch)

    // 1分間に1回チャンネル情報を再取得
    setInterval(() => updateChannels(dispatch), 10000)

    // ログイン情報
    firebase.auth().onAuthStateChanged((user) => {
      user
        .getIdToken(true)
        .then((idToken) => {
          const token = document.getElementsByName('csrf-token')[0]['content']
          const signinRails = async () => {
            await fetch('/api/v1/accounts', {
              credentials: 'same-origin',
              method: 'POST',
              headers: {
                'X-CSRF-TOKEN': token,
                Authorization: `Bearer ${idToken}`,
              },
            })

            // ログイン後に「お気に入り」を反映するため、チャンネル情報を再取得する
            updateChannels(dispatch)
          }
          signinRails()
        })
        .catch((error) => {
          console.log(`Firebase getIdToken failed!: ${error.message}`)
        })

      updateUser(dispatch, user.uid, user.displayName, user.photoURL)
    })
  }, [])

  const classes = useStyles({})
  const [isSidebarOpen, setIsSiderbarOpen] = useState(false)
  const handleDrawerToggle = () => {
    setIsSiderbarOpen(!isSidebarOpen)
  }

  return (
    <BrowserRouter forceRefresh={true}>
      <PageViewTracker>
        <div className={classes.root}>
          <CssBaseline />
          <PecaLiveAppBar onAppButtonClick={handleDrawerToggle} />

          {isMobile ? (
            <Drawer
              variant="temporary"
              anchor="left"
              open={isSidebarOpen}
              onClose={handleDrawerToggle}
              classes={{ paper: classes.drawerPaper }}
              ModalProps={{ keepMounted: true /* スマホの性能改善 */ }}
            >
              <SideBar key={'sidebar-mobile'} onChannelClick={() => setIsSiderbarOpen(false)} />
            </Drawer>
          ) : (
            <Drawer
              variant="permanent"
              anchor="left"
              open={true}
              onClose={handleDrawerToggle}
              className={classes.drawer}
              classes={{ paper: classes.drawerPaper }}
            >
              <SideBar key={'sidebar-pc'} onChannelClick={() => setIsSiderbarOpen(false)} />
            </Drawer>
          )}

          <div>
            <div className={classes.toolbar} />
            <main>
              <Switch>
                <Route exact path="/" render={(props) => <ChannelList />} />
                <Route
                  path="/:channelName"
                  render={(props) => {
                    return (
                      <div
                        style={{
                          width: window.innerWidth > 800 ? 800 : window.innerWidth,
                          height: window.innerHeight - 64,
                        }}
                      >
                        <ChannelPlayer channelName={props.match.params.channelName} isHls={isIOS} local={false} />
                      </div>
                    )
                  }}
                />
                {/*<Route*/}
                {/*  path="/hls/:channelName"*/}
                {/*  render={(props) => {*/}
                {/*    return <ChannelPlayer channelName={props.match.params.channelName} isHls={true} local={false} />*/}
                {/*  }}*/}
                {/*/>*/}
                {/*<Route*/}
                {/*  path="/local/:channelName"*/}
                {/*  render={(props) => {*/}
                {/*    return <ChannelPlayer channelName={props.match.params.channelName} isHls={true} local={true} />*/}
                {/*  }}*/}
                {/*/>*/}
              </Switch>
            </main>
          </div>
        </div>
      </PageViewTracker>
    </BrowserRouter>
  )
}

export default App
