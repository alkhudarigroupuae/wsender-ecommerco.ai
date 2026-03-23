import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from './Button.jsx'

function pickRecorderMime() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c
  }
  return ''
}

function extForMime(mime) {
  const m = String(mime || '')
  if (m.includes('webm')) return 'webm'
  if (m.includes('ogg')) return 'ogg'
  if (m.includes('mp4') || m.includes('mpeg')) return 'm4a'
  return 'webm'
}

export function VoiceRecorder({ onRecorded, disabled }) {
  const [phase, setPhase] = useState('idle')
  const [err, setErr] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chosenMimeRef = useRef('')

  const stopStream = useCallback(() => {
    const s = streamRef.current
    if (s) {
      s.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      stopStream()
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try {
          recorderRef.current.stop()
        } catch {
          // ignore
        }
      }
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [stopStream])

  const setBlobPreview = useCallback((blob) => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return blob ? URL.createObjectURL(blob) : null
    })
  }, [])

  async function start() {
    setErr(null)

    if (phase === 'done') {
      setBlobPreview(null)
      onRecorded?.(null)
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErr('This browser cannot access the microphone.')
      return
    }
    if (typeof MediaRecorder === 'undefined') {
      setErr('MediaRecorder is not available.')
      return
    }

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
    } catch (e) {
      setErr(e?.message || 'Microphone permission denied.')
      return
    }

    const [track] = stream.getAudioTracks()
    if (!track) {
      stream.getTracks().forEach((t) => t.stop())
      setErr('No audio track from microphone.')
      return
    }

    streamRef.current = stream
    const mime = pickRecorderMime()
    chosenMimeRef.current = mime || 'audio/webm'

    let recorder
    try {
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
    } catch {
      recorder = new MediaRecorder(stream)
    }

    recorderRef.current = recorder
    chunksRef.current = []

    recorder.addEventListener('dataavailable', (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    })

    recorder.addEventListener('stop', () => {
      stopStream()
      recorderRef.current = null

      const outType = recorder.mimeType || chosenMimeRef.current || 'audio/webm'
      const blob = new Blob(chunksRef.current, { type: outType })
      chunksRef.current = []

      if (blob.size < 64) {
        setErr('Recording is empty or too short.')
        setPhase('idle')
        return
      }

      setBlobPreview(blob)
      setPhase('done')
      const name = `voice-note.${extForMime(outType)}`
      const file = new File([blob], name, { type: outType })
      onRecorded?.(file)
    })

    try {
      recorder.start(200)
      setPhase('recording')
    } catch (e) {
      stopStream()
      recorderRef.current = null
      setErr(e?.message || 'Could not start recording.')
      setPhase('idle')
    }
  }

  function stop() {
    const rec = recorderRef.current
    if (rec && rec.state === 'recording') {
      rec.stop()
      setPhase('stopping')
    }
  }

  function clear() {
    setErr(null)
    setPhase('idle')
    setBlobPreview(null)
    onRecorded?.(null)
  }

  const canRecord = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  return (
    <div className="field">
      <div className="field-label">Voice note (optional)</div>
      <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
        {phase === 'idle' || phase === 'done' ? (
          <Button type="button" variant="primary" size="sm" disabled={disabled || !canRecord} onClick={start}>
            {phase === 'done' ? 'Record again' : 'Start recording'}
          </Button>
        ) : null}
        {phase === 'recording' ? (
          <Button type="button" variant="danger" size="sm" disabled={disabled} onClick={stop}>
            Stop
          </Button>
        ) : null}
        {phase === 'stopping' ? (
          <span className="field-hint" style={{ margin: 0 }}>
            Saving…
          </span>
        ) : null}
        {phase === 'done' ? (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={clear}>
            Remove recording
          </Button>
        ) : null}
      </div>
      {previewUrl ? (
        <div style={{ marginTop: 12 }}>
          <audio
            key={previewUrl}
            className="input"
            style={{ width: '100%', minHeight: 44 }}
            controls
            playsInline
            preload="auto"
            src={previewUrl}
          >
            Audio not supported.
          </audio>
        </div>
      ) : null}
      {err ? <div className="callout callout-danger" style={{ marginTop: 10 }}>{err}</div> : null}
      <div className="field-hint" style={{ marginTop: 8 }}>
        Uses your mic (WebM/Opus in Chrome). The player above is the same file attached to the campaign.
      </div>
    </div>
  )
}
