/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';

(async () => {
  const devices = await navigator.mediaDevices.enumerateDevices()

  const videoSources = devices.filter(d => d.kind === 'videoinput')

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

    document.body.removeChild(select)

    let blurred = false

    window.addEventListener('keydown', ev => {
      switch (ev.key) {
        case 'b':
          cam.style.filter = blurred ? '' : 'blur(22px)'
          blurred = !blurred
      }
    })
  }
})()


