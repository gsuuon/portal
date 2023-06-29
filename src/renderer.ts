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

window.setup = async () => {
  const cam = document.getElementById('camera') as HTMLVideoElement
  const outer = document.getElementById('outer')
  let stream : MediaStream | undefined;

  if (window.portalOptions?.circle) {
    outer.classList.remove('rectangle')
  }

  const addFilterTransparent = () => {
      cam.style.filter = window.getComputedStyle(cam).filter + ' url(#transparentBlack)'
  }

  const removeFilterTransparent = () => {
      cam.style.filter = window.getComputedStyle(cam).filter.replace('url("#transparentBlack")', '')
  }

  if (window.portalOptions?.transparent) {
    addFilterTransparent()
  }

  const toggleTransparency = (() => {
    let transparent = !!window.portalOptions?.transparent

    return () => {
      if (transparent) {
        removeFilterTransparent()
        document.getElementById('outer').style.background = ''
        document.getElementById('sheen').style.opacity = ''
      } else {
        addFilterTransparent()
        document.getElementById('outer').style.background = 'linear-gradient(354deg, #00000099, transparent)'
        document.getElementById('sheen').style.opacity = '0.2'
      }
      transparent = !transparent
    }
  })()

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

  const toggleBlur = (() => {
    let blurred = false

    return () => {
      if (!blurred) {
        const filters = window.getComputedStyle(cam).filter
        cam.style.filter = filters + ' blur(22px)'
      } else {
        cam.style.filter = ''
      }
      blurred = !blurred
    }
  })()

  const toggleHide = (() => {
    let hidden = false

    return () => {
      cam.style.opacity = hidden ? '1' : '0'
      hidden = !hidden
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
