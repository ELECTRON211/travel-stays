import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Camera, Check, ImageUp, RotateCcw, X } from 'lucide-react'

// A camera window: live preview, "Take photo", then "Use photo" or "Retake".
// `facingMode` is 'user' (front camera, for selfies) or 'environment' (back
// camera, for photographing an ID). If the camera can't open, the person can
// choose a file instead. Calls onCapture(File) with a JPEG.
export default function CameraCapture({ open, facingMode = 'user', title = 'Take a selfie', onCapture, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState('')
  const [shot, setShot] = useState(null) // { blob, url }

  const selfie = facingMode === 'user'

  // Start the camera when the window opens; always switch it off when it closes.
  useEffect(() => {
    if (!open) return
    let cancelled = false

    if (!navigator.mediaDevices?.getUserMedia) {
      Promise.resolve().then(() => setError('This browser can’t open the camera.'))
    } else {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
        .then((stream) => {
          if (cancelled) return stream.getTracks().forEach((t) => t.stop())
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => {})
          }
        })
        .catch((err) =>
          setError(
            err?.name === 'NotAllowedError'
              ? 'Camera access was blocked. Allow the camera in your browser settings, or choose a photo instead.'
              : 'We couldn’t find a camera. You can choose a photo instead.',
          ),
        )
    }

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setShot(null)
      setError('')
    }
  }, [open, facingMode])

  function takePhoto() {
    const video = videoRef.current
    if (!video?.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (selfie) {
      // Save the selfie the way the person saw it in the mirrored preview.
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => blob && setShot({ blob, url: URL.createObjectURL(blob) }), 'image/jpeg', 0.9)
  }

  function confirmPhoto() {
    const name = selfie ? 'selfie.jpg' : 'id-photo.jpg'
    onCapture(new File([shot.blob], name, { type: 'image/jpeg' }))
    onClose()
  }

  function pickFile(e) {
    const file = e.target.files?.[0]
    if (file) {
      onCapture(file)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-stone-950/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="flex items-center gap-2 font-semibold text-stone-900">
                <Camera className="h-5 w-5 text-emerald-700" /> {title}
              </h2>
              <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-stone-100" aria-label="Close camera">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative aspect-4/3 bg-stone-900">
              {error ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-white">
                  <p className="text-sm text-white/80">{error}</p>
                  <label className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-stone-900">
                    <ImageUp className="h-4 w-4" /> Choose a photo
                    <input type="file" accept="image/*" capture={facingMode} className="hidden" onChange={pickFile} />
                  </label>
                </div>
              ) : shot ? (
                <img src={shot.url} alt="Your photo" className="h-full w-full object-cover" />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    className={`h-full w-full object-cover ${selfie ? '-scale-x-100' : ''}`}
                  />
                  {/* Guide: an oval for a face, a card shape for an ID */}
                  <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div
                      className={`border-4 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] ${
                        selfie ? 'h-3/4 w-1/2 rounded-[50%]' : 'h-1/2 w-3/4 rounded-2xl'
                      }`}
                    />
                  </div>
                  <p className="absolute inset-x-0 bottom-3 text-center text-sm font-medium text-white drop-shadow">
                    {selfie ? 'Fit your face in the oval, in good light' : 'Fit your ID card in the frame'}
                  </p>
                </>
              )}
            </div>

            {!error && (
              <div className="flex justify-center gap-3 p-5">
                {shot ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShot(null)}
                      className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 hover:ring-stone-900"
                    >
                      <RotateCcw className="h-4 w-4" /> Retake
                    </button>
                    <button
                      type="button"
                      onClick={confirmPhoto}
                      className="flex items-center gap-2 rounded-full bg-emerald-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
                    >
                      <Check className="h-4 w-4" /> Use photo
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={takePhoto}
                    className="flex items-center gap-2 rounded-full bg-emerald-800 px-7 py-3 text-sm font-semibold text-white hover:bg-emerald-900"
                  >
                    <Camera className="h-4 w-4" /> Take photo
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
