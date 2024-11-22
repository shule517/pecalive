import React, { useEffect, useState } from 'react'
import FlvJs from 'flv.js'
// import videojs from 'video.js'
import Channel from '../types/Channel'
import styled from 'styled-components'
import { useSelectorPeerCast } from '../modules/peercastModule'
import PlayArrowIcon from '@material-ui/icons/PlayArrow'
import ArrowBackIcon from '@material-ui/icons/ArrowBack'
import ArrowForwardIcon from '@material-ui/icons/ArrowForward'
import PictureInPictureAltIcon from '@material-ui/icons/PictureInPictureAlt'
import FullscreenIcon from '@material-ui/icons/Fullscreen'
import IconButton from '@material-ui/core/IconButton'
import SettingsIcon from '@material-ui/icons/Settings'
import Toolbar from '@material-ui/core/Toolbar'
import RefreshIcon from '@material-ui/icons/Refresh'
import { Tooltip } from '@material-ui/core'
import PauseIcon from '@material-ui/icons/Pause'
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import { VolumeDown, VolumeUp } from '@material-ui/icons'
import Slider from '@material-ui/core/Slider'
import VolumeUpIcon from '@material-ui/icons/VolumeUp'
import VolumeOffIcon from '@material-ui/icons/VolumeOff'
import { isMobile, isIOS } from 'react-device-detect'
import CircularProgress from '@material-ui/core/CircularProgress'
import SkipNextIcon from '@material-ui/icons/SkipNext'
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious'
import FavoriteIcon from '@material-ui/icons/Favorite'
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder'
import { updateChannels, useSelectorChannels } from '../modules/channelsModule'
import { useDispatch } from 'react-redux'
import { useSelectorUser } from '../modules/userModule'
import LoginDialog from './LoginDialog'
import Alert from '@material-ui/lab/Alert'

type Props = {
  channel: Channel
  isHls: boolean
  local: boolean
  onClickPreviousChannel: () => void
  onClickNextChannel: () => void
  onClickReload: () => void
}

const Video = (props: Props) => {
  const dispatch = useDispatch()
  const currentUser = useSelectorUser()
  const { channel, isHls, local, onClickPreviousChannel, onClickNextChannel, onClickReload } = props

  const peercast = useSelectorPeerCast()
  const [player, setPlayer] = useState<FlvJs.Player>(null)
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string>(null)
  const [videoWidth, setVideoWidth] = useState<number>(1280)
  const [videoHeight, setVideoHeight] = useState<number>(720)
  const [muted, setMuted] = useState<boolean>(false)
  const [video, setVideo] = useState<HTMLMediaElement>(null)
  const [visibleControll, setVisibleControll] = useState<boolean>(false)
  const [readyState, setReadyState] = useState<number>(0)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [audioBlocked, setAudioBlocked] = useState<boolean>(false)

  const videoElementId = `videoElement-${channel.streamId}`
  const isHlsPlay = isHls && channel.streamId.length

  const width = window.parent.screen.width < 800 ? window.parent.screen.width : 800
  const aspectRate = videoHeight / videoWidth
  const height = width * aspectRate
  // PictureInPictureの有効確認
  const enablePictureInPicture =
    (document as any).pictureInPictureEnabled && video && !(video as any).disablePictureInPicture

  useEffect(() => {
    if (channel.streamId.length <= 0) {
      return
    }

    // TODO HLS再生
    if (isHlsPlay) {
      // console.log('hls play:' + streamUrl);
      // var player = videojs(videoElementId);
      return
    }

    if (isHls) {
      return
    }

    // TODO FLV再生
    const videoElement: HTMLMediaElement = document.getElementById(videoElementId) as HTMLMediaElement
    setVideo(videoElement)

    const flvStreamUrl = channel.flvStreamUrl(peercast.tip)

    // 初回再生 or 配信を切り替えた場合
    if (!player || currentStreamUrl !== flvStreamUrl) {
      if (player) {
        player.pause()
        player.unload()
        player.detachMediaElement()
        player.destroy()
      }

      const flvPlayer = FlvJs.createPlayer({
        type: 'flv',
        isLive: true,
        url: flvStreamUrl,
      })
      flvPlayer.on('media_info', (arg) => {
        setVideoWidth(flvPlayer.mediaInfo.width)
        setVideoHeight(flvPlayer.mediaInfo.height)
      })

      flvPlayer.attachMediaElement(videoElement)
      flvPlayer.load()
      ;(flvPlayer.play() as Promise<void>).catch((error) => {
        console.error(error)
        if (error instanceof DOMException) {
          setAudioBlocked(true)
          // ミュート再生を試みる
          flvPlayer.muted = true
          setMuted(flvPlayer.muted)
          flvPlayer.play()
        }
      })

      // 再生ステートを初期化
      setReadyState(0)
      videoElement.onplaying = (event) => {
        setReadyState(videoElement.readyState)
      }
      videoElement.onwaiting = (event) => {
        setReadyState(videoElement.readyState)
      }

      setPlayer(flvPlayer)
      setCurrentStreamUrl(flvStreamUrl)
    }
  })

  const videoStyleOnClick = () => {
    if (isIOS || !channel.isFlv) {
      // iOSの場合は タップしたらVLCで再生
      window.location.href = channel.vlcStreamUrl(peercast.tip)
    } else {
      setVisibleControll(!visibleControll)
      // if (!visibleControll) {
      //   // タップして3秒後に消す
      //   setTimeout(() => {
      //     setVisibleControll(false)
      //   }, 3000)
      // }
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <VideoStyle
        id={videoElementId}
        // controls 動画プレイヤーのコントローラは非表示
        style={{ width: width, height: height }}
        onMouseEnter={() => {
          setVisibleControll(true)
        }}
        onMouseLeave={() => {
          setVisibleControll(false)
        }}
        onClick={() => videoStyleOnClick()}
      />

      <LoginDialog open={loginDialogOpen} onClose={() => setLoginDialogOpen(false)} />

      <Progress
        style={{
          left: width / 2 - 40,
          top: height / 2 - 40,
        }}
      >
        {isIOS || !channel.isFlv ? (
          <PlayArrowIcon
            color="secondary"
            onClick={() => videoStyleOnClick()}
            style={{
              color: 'lightgray',
              fontSize: 70,
              left: width / 2 - 40,
              top: height / 2 - 40,
            }}
          />
        ) : (
          readyState < 3 && (
            <CircularProgress size={80} style={{ color: 'lightgray' }} onClick={() => videoStyleOnClick()} />
          )
        )}
      </Progress>

      <Alert style={{visibility: (audioBlocked && muted) ? 'visible' : 'hidden', position: 'absolute', width: width - 20, left: 10, top: 10 }} severity="info" onClick={() => { setAudioBlocked(false); setMuted(player.muted = false) }}>ここをタップしてミュートを解除</Alert>

      {(visibleControll || isIOS) && (
        <VideoControl
          style={{ width: width }}
          onMouseEnter={() => {
            !isIOS && setVisibleControll(true)
          }}
          onMouseLeave={() => {
            !isIOS && setVisibleControll(false)
          }}
        >
          <FooterLeftControl>
            <Tooltip title="前の配信へ" placement="top" arrow>
              <IconButton color="primary" component="span" onClick={() => onClickPreviousChannel()}>
                <SkipPreviousIcon style={{ color: 'white' }} />
              </IconButton>
            </Tooltip>

            {!isIOS && (
              <Tooltip title="再生" placement="top" arrow>
                <IconButton
                  color="primary"
                  component="span"
                  onClick={() => {
                    player.play()
                  }}
                >
                  <PlayArrowIcon style={{ color: 'white' }} />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="次の配信へ" placement="top" arrow>
              <IconButton color="primary" component="span" onClick={() => onClickNextChannel()}>
                <SkipNextIcon style={{ color: 'white' }} />
              </IconButton>
            </Tooltip>

            {!isIOS && (
              <Tooltip title="再接続(Bump)" placement="top" arrow>
                <IconButton color="primary" component="span" onClick={() => onClickReload()}>
                  <RefreshIcon style={{ color: 'white' }} />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title={channel.isFavorited ? 'お気に入りに登録済み' : 'お気に入りに登録'} placement="top" arrow>
              <IconButton
                color="primary"
                component="span"
                onClick={() => {
                  const favoriteChannel = async () => {
                    const token = document.getElementsByName('csrf-token')[0]['content']
                    const headers = {
                      'Content-Type': 'application/x-www-form-urlencoded',
                      'X-CSRF-TOKEN': token,
                    }
                    const body = `channel_name=${channel.name}`

                    await fetch('/api/v1/favorites', {
                      credentials: 'same-origin',
                      method: channel.isFavorited ? 'DELETE' : 'POST',
                      headers: headers,
                      body,
                    })

                    await updateChannels(dispatch) // 画面に反映
                    // TODO: setFavoriteChannel(channels, channel.name, false, dispatch)
                  }
                  if (currentUser.isLogin) {
                    favoriteChannel()
                  } else {
                    // ログインしていない場合は、ログインを促す
                    setLoginDialogOpen(true)
                  }
                }}
              >
                {channel.isFavorited ? (
                  <FavoriteIcon color="secondary" />
                ) : (
                  <FavoriteBorderIcon style={{ color: 'white' }} />
                )}
              </IconButton>
            </Tooltip>
          </FooterLeftControl>

          <FooterRightControl>
            {player && !isMobile ? ( // PCだけで表示
              muted ? (
                <Tooltip title="ミュートを解除" placement="top" arrow>
                  <IconButton
                    color="primary"
                    component="span"
                    onClick={() => {
                      player.muted = false
                      setMuted(player.muted)
                      setAudioBlocked(false)
                    }}
                  >
                    <VolumeOffIcon style={{ color: 'white' }} />
                  </IconButton>
                </Tooltip>
              ) : (
                <>
                  <div
                    style={{
                      backgroundColor: 'rgba(100, 100, 100, 0.4)',
                      position: 'absolute',
                      top: '-140px',
                      left: '5px',
                      borderRadius: '10px',
                      padding: '20px 6px 15px 6px',
                    }}
                  >
                    <Slider
                      color="secondary"
                      orientation="vertical"
                      defaultValue={player ? player.volume * 100 : 100}
                      valueLabelDisplay="auto"
                      style={{ height: '100px' }}
                      onChange={(event, newValue) => {
                        if (typeof newValue === 'number') {
                          const value = newValue * 0.01
                          player.volume = value
                        }
                      }}
                    />
                  </div>

                  <Tooltip title="ミュート" placement="top" arrow>
                    <IconButton
                      color="primary"
                      component="span"
                      onClick={() => {
                        player.muted = true
                        setMuted(player.muted)
                      }}
                    >
                      <VolumeUpIcon style={{ color: 'white' }} />
                    </IconButton>
                  </Tooltip>
                </>
              )
            ) : null}

            {enablePictureInPicture && (
              <Tooltip title="ミニプレイヤー" placement="top" arrow>
                <IconButton
                  color="primary"
                  component="span"
                  onClick={() => {
                    ;(video as any).requestPictureInPicture()
                  }}
                >
                  <PictureInPictureAltIcon style={{ color: 'white' }} />
                </IconButton>
              </Tooltip>
            )}

            {!isIOS && (
              <Tooltip title="フルスクリーン" placement="top" arrow>
                <IconButton
                  color="primary"
                  component="span"
                  onClick={() => {
                    video.requestFullscreen()
                  }}
                >
                  <FullscreenIcon style={{ color: 'white' }} />
                </IconButton>
              </Tooltip>
            )}
          </FooterRightControl>
        </VideoControl>
      )}

      {/*{*/}
      {/*  isHlsPlay ? (*/}
      {/*    <video id={videoElementId} width={1280} height={720} className="video-js vjs-default-skin" controls >*/}
      {/*      <source src={streamUrl} type="application/x-mpegURL" />*/}
      {/*    </video>*/}
      {/*  ) : null*/}
      {/*}*/}
    </div>
  )
}

const VideoStyle = styled.video`
  background-color: #333333;
  max-width: 800px;
  max-height: 500px;
`

const VideoControl = styled.div`
  background: -moz-linear-gradient(top, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.4) 30%, rgba(0, 0, 0, 0.9));
  background: -webkit-linear-gradient(top, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.4) 30%, rgba(0, 0, 0, 0.9));
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.4) 30%, rgba(0, 0, 0, 0.9));
  position: absolute;
  left: 0;
  bottom: 6px;
  height: 60px;
  color: white;
`

const Progress = styled.div`
  position: absolute;
  margin: auto;
`

const FooterLeftControl = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
`

const FooterRightControl = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
`

export default Video
