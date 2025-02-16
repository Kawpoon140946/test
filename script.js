let webcamStream;
let model;
let isDetecting = false;

const videoElement = document.getElementById('webcam');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const liveView = document.getElementById('liveView');

// ตรวจสอบว่ากล้องรองรับหรือไม่
function getUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// โหลดโมเดล COCO-SSD
async function init() {
  if (!getUserMediaSupported()) {
    console.error('getUserMedia() is not supported by your browser');
    return;
  }

  try {
    model = await cocoSsd.load();
    console.log('COCO-SSD model loaded successfully');
  } catch (error) {
    console.error('Error loading model:', error);
  }
}

// เริ่มใช้งานกล้อง
async function startWebcam() {
  if (isDetecting || !model) {
    console.warn('Webcam already running or model not loaded');
    return;
  }

  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = webcamStream;
    startButton.disabled = true;
    stopButton.disabled = false;
    isDetecting = true;
    detectObjects();
  } catch (error) {
    console.error('Error accessing webcam:', error);
  }
}

// ปิดกล้อง
function stopWebcam() {
  if (!isDetecting) return;

  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
    videoElement.srcObject = null;
  }

  startButton.disabled = false;
  stopButton.disabled = true;
  isDetecting = false;
}

// ตรวจจับวัตถุ
async function detectObjects() {
  while (isDetecting) {
    try {
      if (!model) {
        console.error('Model not loaded');
        break;
      }

      const predictions = await model.detect(videoElement);
      displayPredictions(predictions);

      await new Promise(resolve => requestAnimationFrame(resolve));
    } catch (error) {
      console.error('Error detecting objects:', error);
      stopWebcam();
    }
  }
}

// แสดงผล
function displayPredictions(predictions) {
  liveView.innerHTML = '';

  predictions.forEach(prediction => {
    if (prediction.score > 0.5) {
      const p = document.createElement('p');
      p.innerText = `${prediction.class} - ${Math.round(prediction.score * 100)}% confidence.`;
      liveView.appendChild(p);
    }
  });
}

// โหลดโมเดลเมื่อหน้าเว็บพร้อม
window.addEventListener('load', init);

// เชื่อมปุ่มเข้ากับฟังก์ชัน
startButton.addEventListener('click', startWebcam);
stopButton.addEventListener('click', stopWebcam);
