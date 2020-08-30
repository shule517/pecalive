import React, { useState } from 'react'
import { useEffect } from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'

// fontawesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { faHeadphones as fasHeadphones } from '@fortawesome/free-solid-svg-icons/faHeadphones'
import { faHeart as fasHeart } from '@fortawesome/free-solid-svg-icons/faHeart'
import { faHeart as farHeart } from '@fortawesome/free-regular-svg-icons/faHeart'
import { faArrowLeft as fasArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft'
import { faArrowRight as fasArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight'
import { faRedoAlt as fasRedoAlt } from '@fortawesome/free-solid-svg-icons/faRedoAlt'
import { faPlayCircle as fasPlayCircle } from '@fortawesome/free-solid-svg-icons/faPlayCircle'
import { faClock as fasClock } from '@fortawesome/free-solid-svg-icons/faClock'

import { isIOS, isMobile } from 'react-device-detect'
import ChannelList from './components/ChannelList'
import ChannelPlayer from './components/ChannelPlayer'
import PageViewTracker from './components/PageViewTracker'
import SideBar from './components/SideBar'
import PecaLiveAppBar from './components/PecaLiveAppBar'
import Drawer from '@material-ui/core/Drawer'
import CssBaseline from '@material-ui/core/CssBaseline'
const drawerWidth = 240
import { useDispatch } from 'react-redux'
import { updateChannels } from './modules/channelsModule'
import { updateFavorites } from './modules/favoritesModule'
import { updatePeerCast } from './modules/peercastModule'
import PeerCast from './types/PeerCast'
import firebase from 'firebase'
import { updateUser } from './modules/userModule'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex'
    },
    drawer: {
      [theme.breakpoints.up('sm')]: {
        width: isMobile ? window.parent.screen.width * 0.8 : drawerWidth,
        flexShrink: 0
      }
    },
    drawerPaper: {
      width: isMobile ? window.parent.screen.width * 0.8 : drawerWidth
    },
    toolbar: theme.mixins.toolbar
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
    firebase.auth().onAuthStateChanged(user => {
      user
        .getIdToken(true)
        .then(idToken => {
          const token = document.getElementsByName('csrf-token')[0]['content']
          const signinRails = async () => {
            await fetch('/api/v1/accounts', {
              credentials: 'same-origin',
              method: 'POST',
              headers: {
                'X-CSRF-TOKEN': token,
                Authorization: `Bearer ${idToken}`
              }
            })
          }
          signinRails()
        })
        .catch(error => {
          console.log(`Firebase getIdToken failed!: ${error.message}`)
        })

      updateUser(dispatch, user.uid, user.displayName, user.photoURL)
    })

    //fontawesomeを読み込み
    library.add(
      fasHeadphones,
      fasHeart,
      farHeart,
      fasArrowLeft,
      fasArrowRight,
      fasRedoAlt,
      fasPlayCircle,
      fasClock
    )
  }, [])

  const classes = useStyles({})
  const [isSidebarOpen, setIsSiderbarOpen] = React.useState(false)
  const handleDrawerToggle = () => {
    setIsSiderbarOpen(!isSidebarOpen)
  }

  return (
    <BrowserRouter>
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
              <SideBar
                key={'sidebar-mobile'}
                onChannelClick={() => setIsSiderbarOpen(false)}
              />
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
              <SideBar
                key={'sidebar-pc'}
                onChannelClick={() => setIsSiderbarOpen(false)}
              />
            </Drawer>
          )}

          <div>
            <div className={classes.toolbar} />
            <main>
              <Switch>
                <Route exact path="/" render={props => <ChannelList />} />
                <Route
                  path="/channels/:streamId"
                  render={props => {
                    return (
                      <ChannelPlayer
                        streamId={props.match.params.streamId}
                        isHls={isIOS}
                        local={false}
                      />
                    )
                  }}
                />
                <Route
                  path="/hls/:streamId"
                  render={props => {
                    return (
                      <ChannelPlayer
                        streamId={props.match.params.streamId}
                        isHls={true}
                        local={false}
                      />
                    )
                  }}
                />
                <Route
                  path="/local/:streamId"
                  render={props => {
                    return (
                      <ChannelPlayer
                        streamId={props.match.params.streamId}
                        isHls={true}
                        local={true}
                      />
                    )
                  }}
                />
              </Switch>
            </main>
          </div>
        </div>
      </PageViewTracker>
    </BrowserRouter>
  )
}

export default App
