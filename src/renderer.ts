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
  let state : any = null

  return () => {
    if (is_on) {
      state = off(state)
    } else {
      state = on(state)
    }
    is_on = !is_on
  }
}

const elements = {
  cam: document.getElementById('camera') as HTMLVideoElement,
  outer: document.getElementById('outer'),
  bgGradient: document.getElementById('gradient-bg'),
  sheen: document.getElementById('sheen'),
  select: document.getElementById('select-device')
}

const calcAndSetBgGradientSize = () => {
  elements.bgGradient.style.setProperty(
    '--size',
    Math.hypot(
      window.innerWidth,
      window.innerHeight
    ) + 'px'
  )
}

window.addEventListener('resize', calcAndSetBgGradientSize)
calcAndSetBgGradientSize()

window.setup = async () => {
  let stream : MediaStream | undefined;

  if (window.portalOptions?.circle) {
    elements.outer.classList.remove('rectangle')
  }

  const getCamFilter = () => {
    const style = window.getComputedStyle(elements.cam).filter
    if (style === 'none') {
      return ''
    }
    return style
  }

  const addCamFilter = (filter: string) =>
    elements.cam.style.filter = getCamFilter() + ' ' + filter

  const removeCamFilter = (filter: string) =>
    elements.cam.style.filter = getCamFilter().replace(filter, '')

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

      elements.cam.srcObject = stream
    } catch {
      alert('could not connect stream');
    };
  }

  const toggleTransparency = toggle({
    start: !!window.portalOptions?.transparent,
    on: () => {
      addCamFilter(filter_transparent)
      elements.outer.style.background = 'linear-gradient(354deg, #00000099, transparent)'
      elements.sheen.style.opacity = '0.2'
      elements.bgGradient.style.display = 'none'
    },
    off: () => {
      removeCamFilter(filter_transparent)
      elements.outer.style.background = ''
      elements.sheen.style.opacity = ''
      elements.bgGradient.style.display = 'block'
    }
  })

  const resizeLarge = () => {
    const original = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    if (elements.outer.classList.contains('rectangle')) {
      window.resizeTo(560, 460)
    } else {
      window.resizeTo(560, 560)
    }

    return original
  }

  // circle
  const toggleShape = toggle({
    start: false,
    off: (state: any) => {
      elements.outer.classList.remove('rectangle')

      if (state) {
        window.resizeTo(state.width, state.height)
      }
    },
    on: () => {
      elements.outer.classList.add('rectangle')
      if (elements.outer.classList.contains('large')) {
        return resizeLarge()
      }
    }
  })

  const toggleLarge = toggle({
    start: false,
    off: (state: any) => {
      elements.outer.classList.remove('large')

      if (state) {
        window.resizeTo(state.width, state.height)
      }
    },
    on: () => {
      elements.outer.classList.add('large')

      return resizeLarge()
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
    off: () => elements.cam.style.opacity = '1',
    on: () => elements.cam.style.opacity = '0'
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
    const select = elements.select

    select.style.display = 'block'

    select.append(document.createElement('option'))

    select.append(
      ...(videoSources.map(d => {
        const opt = document.createElement('option')
        opt.textContent = d.label
        opt.setAttribute('value', d.deviceId)
        return opt
      }))
    )

    select.onchange = (ev) => {
      const deviceId = (ev.target as HTMLSelectElement).value

      if (deviceId === '') { return }
      setDevice(deviceId)
      select.innerHTML = ''
      select.style.display = 'none'
    }
  }

  const zoom = (() => {
    let level = 1

    const start = window.getComputedStyle(elements.cam).transform

    const setZoom = (level_: number) => {
      level = level_
      elements.cam.style.transform = start + ' scale(' + level + ')'
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
      case 'f': // large
        elements.outer.classList.toggle('flat')
        break
      case 'l': // large
        toggleLarge()
        break
      case 'b': // blur
        toggleBlur()
        break
      case 'd': // device
        clearDevice()
        showSelectDevice()
        break
      case 's': // shape
        toggleShape()
        break
      case 'r': // rotate border
        elements.bgGradient.classList.toggle('animated')
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
