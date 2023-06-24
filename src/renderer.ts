import { contextBridge } from 'electron';
import './index.css';

(async () => {
  const setDevice = deviceId => {
    const cam = document.getElementById('camera') as HTMLVideoElement

    navigator.mediaDevices.getUserMedia({
      video: {
        deviceId
      }
    }).then(function(stream) {
        cam.srcObject = stream;
      }).catch(function() {
        alert('could not connect stream');
      });

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

    window.addEventListener('keydown', ev => {
      switch (ev.key) {
        case 'b':
          toggleBlur()
          break
      }
    })
  }

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
      document.body.removeChild(select)
    }
  }

  const devices = await navigator.mediaDevices.enumerateDevices()

  const videoSources = devices.filter(d => d.kind === 'videoinput')

  console.log({videoSources})

  setDevice(videoSources[1].deviceId)

  // showSelectDevice()
})()

window.setCircle = () => {
  const outer = document.getElementById('outer')
  outer.classList.remove('rectangle')
}
