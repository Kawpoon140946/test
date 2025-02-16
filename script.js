let webcamStream;
let model;
let isDetecting = false;
const videoElement = document.getElementById('webcam');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const liveView = document.getElementById('liveView');

// Check if webcam access is supported.
function getUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Initialize the app
async function init() {
  if (!getUserMediaSupported()) {
    console.error('getUserMedia() is not supported by your browser');
    return;
  }

  // Load COCO-SSD model
  model = await cocoSsd.load();
}

// Enable the live webcam view and start object detection.
async function startWebcam() {
  if (isDetecting) return;

  // getUsermedia parameters to force video but not audio.
  const constraints = { video: true };

  try {
    // Activate the webcam stream.
    webcamStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = webcamStream;

    // Enable the stop button and disable the start button.
    startButton.disabled = true;
    stopButton.disabled = false;

    // Start object detection.
    detectObjects();
  } catch (error) {
    console.error('Error accessing webcam:', error);
  }
}

// Disable the live webcam view.
function stopWebcam() {
  if (!isDetecting) return;

  if (webcamStream) {
    // Stop the webcam stream.
    const tracks = webcamStream.getTracks();
    tracks.forEach(track => track.stop());

    // Stop the video element.
    videoElement.srcObject = null;

    // Disable the stop button and enable the start button.
    startButton.disabled = false;
    stopButton.disabled = true;

    // Stop object detection.
    isDetecting = false;
  }
}

// Perform object detection on the webcam stream.
async function detectObjects() {
  isDetecting = true;

  // Now let's start classifying a frame in the stream.
  while (isDetecting) {
    try {
      const predictions = await model.detect(videoElement);

      // Display predictions on the live view.
      displayPredictions(predictions);

      // Wait for the next animation frame.
      await new Promise(resolve => requestAnimationFrame(resolve));
    } catch (error) {
      console.error('Error detecting objects:', error);
      isDetecting = false;
    }
  }
}

// Display object detection predictions on the live view.
function displayPredictions(predictions) {
  // Clear previous predictions.
  liveView.innerHTML = '';

  // Loop through predictions and draw them on the live view.
  predictions.forEach(prediction => {
    if (prediction.score > 0.5) {
      const p = document.createElement('p');
      p.innerText = `${prediction.class} - ${Math.round(prediction.score * 100)}% confidence.`;
      liveView.appendChild(p);
    }
  });
}

// Initialize the app when the page loads.
init();
