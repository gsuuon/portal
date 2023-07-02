import './index.css';

declare global {
  interface Window {
    portalOptions: {
      circle?: boolean
      videoDeviceName?: string
      transparent?: boolean
    };
    setup: Function
  }
}

const toggle = ({ start, on, off }: {
  start: boolean;
  on: Function;
  off: Function;
}) => {
  let is_on = start

  return () => {
    if (is_on) {
      off()
    } else {
      on()
    }
    is_on = !is_on
  }
}

window.setup = async () => {
  const cam = document.getElementById('camera') as HTMLVideoElement
  const outer = document.getElementById('outer')
  let stream : MediaStream | undefined;

  if (window.portalOptions?.circle) {
    outer.classList.remove('rectangle')
  }

  const getCamFilter = () => {
    const style = window.getComputedStyle(cam).filter
    if (style === 'none') {
      return ''
    }
    return style
  }

  const addCamFilter = (filter: string) =>
    cam.style.filter = getCamFilter() + ' ' + filter

  const removeCamFilter = (filter: string) =>
    cam.style.filter = getCamFilter().replace(filter, '')

  const filter_transparent = 'url("#transparentBlack")'

  if (window.portalOptions?.transparent) {
    addCamFilter(filter_transparent)
  }

  const clearDevice = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        if (track.readyState == 'live') {
          track.stop()
        }
      })
    }
  }

  const setDevice = async (deviceId: string) => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId
        }
      })

      cam.srcObject = stream
    } catch {
      alert('could not connect stream');
    };
  }

  const toggleTransparency = toggle({
    start: !!window.portalOptions?.transparent,
    on: () => {
      addCamFilter(filter_transparent)
      document.getElementById('outer').style.background = 'linear-gradient(354deg, #00000099, transparent)'
      document.getElementById('sheen').style.opacity = '0.2'
    },
    off: () => {
      removeCamFilter(filter_transparent)
      document.getElementById('outer').style.background = ''
      document.getElementById('sheen').style.opacity = ''
    }
  })

  const blur_filter = 'blur(22px)'
  const toggleBlur = toggle({
    start: false,
    on: () => addCamFilter(blur_filter),
    off: () => removeCamFilter(blur_filter)
  })

  const toggleHide = toggle({
    start: false,
    off: () => cam.style.opacity = '1',
    on: () => cam.style.opacity = '0'
  })

  const cycleSaturate = (() => {
    const levels = [1, 1.25, 1.5]
    let level = 0
    return () => {
      removeCamFilter(`saturate(${levels[level]})`)
      level = level === levels.length - 1 ? 0 : level + 1
      addCamFilter(`saturate(${levels[level]})`)
    }
  })()

  const showSelectDevice = () => {
    const select = document.createElement('select')

    select.append(document.createElement('option'))

    select.append(
      ...(videoSources.map(d => {
        const opt = document.createElement('option')
        opt.textContent = d.label
        opt.setAttribute('value', d.deviceId)
        return opt
      }))
    )

    document.body.appendChild(select)

    select.onchange = (ev) => {
      const deviceId = (ev.target as HTMLSelectElement).value

      if (deviceId === '') { return }
      setDevice(deviceId)
      select.remove()
    }
  }

  const zoom = (() => {
    let level = 1

    const start = window.getComputedStyle(cam).transform

    const setZoom = (level_: number) => {
      level = level_
      cam.style.transform = start + ' scale(' + level + ')'
    }

    return {
      in: () => {
        setZoom(level + .25)
      },
      out: () => {
        setZoom(level - .25)
      },
      reset: () => {
        setZoom(1)
      }
    }
  })()

  const devices = await navigator.mediaDevices.enumerateDevices()

  const videoSources = devices.filter(d => d.kind === 'videoinput')
  if (window.portalOptions?.videoDeviceName) {
    const device = videoSources.find(d => {
      return d.label.toLowerCase().match(window.portalOptions.videoDeviceName) != null
    })

    if (device) {
      setDevice(device.deviceId)
    }
  } else {
    showSelectDevice()
  }

  window.addEventListener('keydown', ev => {
    switch (ev.key) {
      case 'b': // blur
        toggleBlur()
        break
      case 'd': // device
        clearDevice()
        showSelectDevice()
        break
      case 's': // shape
        outer.classList.toggle('rectangle')
        break
      case 't': // transparent
        toggleTransparency()
        break
      case 'h': // hide
        toggleHide()
        break
      case 'c': // cycle saturate
        cycleSaturate()
        break
      case 'ArrowUp':
        zoom.in()
        break
      case 'ArrowDown':
        zoom.out()
        break
      case 'ArrowLeft':
        zoom.reset()
        break
    }
  })
}
