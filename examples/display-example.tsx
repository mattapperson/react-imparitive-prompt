import { display } from '../src/index'
import type { DisplayHandle } from '../src/types'

// Example 1: Progress indicator using display API
async function showProgress() {
  const progressDisplay = display({
    message: 'Processing files...',
    kind: 'progress',
    initialValue: { percent: 0, status: 'Starting' },
  })

  // Consume progress updates in the background
  const renderProgress = async () => {
    for await (const value of progressDisplay.submitted) {
      console.log(`Progress: ${value.percent}% - ${value.status}`)
      // In a real app, update your UI here
    }
    console.log('Progress display completed')
  }

  // Start rendering
  renderProgress()

  // Simulate work with updates
  await simulateWork(progressDisplay)

  // Clean up when done
  progressDisplay.cancel()
}

async function simulateWork(display: DisplayHandle<{ percent: number; status: string }>) {
  const tasks = [
    { percent: 10, status: 'Reading files', delay: 500 },
    { percent: 30, status: 'Parsing data', delay: 800 },
    { percent: 50, status: 'Processing entries', delay: 1000 },
    { percent: 70, status: 'Generating output', delay: 600 },
    { percent: 90, status: 'Finalizing', delay: 400 },
    { percent: 100, status: 'Complete!', delay: 200 },
  ]

  for (const task of tasks) {
    await new Promise((resolve) => setTimeout(resolve, task.delay))
    display.update({ percent: task.percent, status: task.status })
  }
}

// Example 2: Live log viewer
async function liveLogs() {
  const logDisplay = display<string>({
    message: 'System Logs',
    kind: 'logs',
  })

  // Consume logs
  const showLogs = async () => {
    for await (const logLine of logDisplay.submitted) {
      console.log(`[LOG] ${logLine}`)
    }
  }

  showLogs()

  // Simulate incoming logs
  const logMessages = [
    'Server started on port 3000',
    'Database connection established',
    'Cache initialized',
    'Ready to accept connections',
    'Request received: GET /api/users',
    'Response sent: 200 OK',
  ]

  for (const msg of logMessages) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    logDisplay.update(msg)
  }

  // Stop after all messages
  setTimeout(() => logDisplay.cancel(), 7000)
}

// Example 3: Real-time metrics dashboard
interface Metrics {
  cpu: number
  memory: number
  requests: number
  errors: number
}

async function metricsMonitor() {
  const metricsDisplay = display<Metrics>({
    message: 'System Metrics',
    kind: 'metrics',
    initialValue: { cpu: 0, memory: 0, requests: 0, errors: 0 },
  })

  // Render metrics
  const renderMetrics = async () => {
    for await (const metrics of metricsDisplay.submitted) {
      console.clear()
      console.log('=== System Metrics ===')
      console.log(`CPU Usage: ${metrics.cpu}%`)
      console.log(`Memory: ${metrics.memory}MB`)
      console.log(`Requests: ${metrics.requests}`)
      console.log(`Errors: ${metrics.errors}`)
    }
  }

  renderMetrics()

  // Simulate metric updates
  const updateInterval = setInterval(() => {
    metricsDisplay.update({
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 8192),
      requests: Math.floor(Math.random() * 1000),
      errors: Math.floor(Math.random() * 10),
    })
  }, 1000)

  // Stop after 10 seconds
  setTimeout(() => {
    clearInterval(updateInterval)
    metricsDisplay.cancel()
  }, 10000)
}

// Example 4: File upload progress with multiple files
async function multiFileUpload() {
  interface UploadState {
    files: Array<{ name: string; progress: number; status: string }>
    overall: number
  }

  const uploadDisplay = display<UploadState>({
    message: 'Uploading files...',
    kind: 'upload',
    initialValue: {
      files: [
        { name: 'document.pdf', progress: 0, status: 'pending' },
        { name: 'image.jpg', progress: 0, status: 'pending' },
        { name: 'video.mp4', progress: 0, status: 'pending' },
      ],
      overall: 0,
    },
  })

  // Render upload progress
  const renderUpload = async () => {
    for await (const state of uploadDisplay.submitted) {
      console.clear()
      console.log('=== Upload Progress ===')
      console.log(`Overall: ${state.overall}%`)
      state.files.forEach((file) => {
        console.log(`${file.name}: ${file.progress}% - ${file.status}`)
      })
    }
    console.log('Upload complete!')
  }

  renderUpload()

  // Simulate file uploads
  const files = ['document.pdf', 'image.jpg', 'video.mp4']

  for (let i = 0; i < files.length; i++) {
    // Update status to uploading
    const currentState = {
      files: uploadDisplay.submitted.return?.value?.files || [],
      overall: Math.floor((i / files.length) * 100),
    }
    currentState.files[i].status = 'uploading'
    uploadDisplay.update(currentState as UploadState)

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      currentState.files[i].progress = progress
      currentState.overall = Math.floor(((i + progress / 100) / files.length) * 100)
      uploadDisplay.update(currentState as UploadState)
    }

    currentState.files[i].status = 'complete'
    uploadDisplay.update(currentState as UploadState)
  }

  // Final update
  uploadDisplay.update({
    files: files.map((name) => ({ name, progress: 100, status: 'complete' })),
    overall: 100,
  })

  setTimeout(() => uploadDisplay.cancel(), 1000)
}

// Example 5: Using display with React component
import { useEffect, useState } from 'react'

function ProgressComponent() {
  const [progress, setProgress] = useState<{ percent: number; status: string } | null>(null)

  useEffect(() => {
    const handle = display({
      message: 'Loading application...',
      kind: 'progress',
      initialValue: { percent: 0, status: 'Initializing' },
    })

    // Consume updates
    const consumeUpdates = async () => {
      for await (const value of handle.submitted) {
        setProgress(value)
      }
      setProgress(null) // Clear when done
    }

    consumeUpdates()

    // Simulate progress
    const timer = setInterval(() => {
      const newPercent = Math.min((progress?.percent || 0) + 10, 100)
      handle.update({
        percent: newPercent,
        status: newPercent === 100 ? 'Complete!' : 'Loading...',
      })

      if (newPercent === 100) {
        clearInterval(timer)
        setTimeout(() => handle.cancel(), 1000)
      }
    }, 500)

    return () => {
      clearInterval(timer)
      handle.cancel()
    }
  }, [progress?.percent])

  if (!progress) return null

  return (
    <div>
      <h3>{progress.status}</h3>
      <div style={{ width: '100%', background: '#eee' }}>
        <div
          style={{
            width: `${progress.percent}%`,
            background: '#4CAF50',
            height: '20px',
            transition: 'width 0.3s',
          }}
        />
      </div>
      <p>{progress.percent}%</p>
    </div>
  )
}

export { showProgress, liveLogs, metricsMonitor, multiFileUpload, ProgressComponent }
