// Fullscreen---------------------------------------------------------
document.getElementById('fullscreenButton').addEventListener('click', () => {
  const element = document.documentElement; // The entire document will go fullscreen

  if (!document.fullscreenElement) {
      element.requestFullscreen()
          .then(() => console.log('Entered fullscreen mode'))
          .catch((err) => console.error(`Failed to enter fullscreen mode: ${err.message}`));
  } else {
      document.exitFullscreen()
          .then(() => console.log('Exited fullscreen mode'))
          .catch((err) => console.error(`Failed to exit fullscreen mode: ${err.message}`));
  }
});


// Timer------------------------------------------------------------
const progress = document.querySelector('.progress');
  const timeDisplay = document.querySelector('.time');
  const startButton = document.getElementById('start');
  const resetButton = document.getElementById('reset');

  let duration = 60;
  let timeLeft = duration;
  let timerInterval = null;

  function updateTimerDisplay() {
    const progressValue = (timeLeft / duration) * 283;
    progress.style.strokeDashoffset = progressValue;
    timeDisplay.textContent = timeLeft > 0 ? timeLeft : "Done!";
  }

  function startTimer() {
    if (timerInterval) return; // Prevent multiple intervals
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }, 1000);
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = duration;
    updateTimerDisplay();
  }

  startButton.addEventListener('click', startTimer);
  resetButton.addEventListener('click', resetTimer);

  // Initialize the display
  updateTimerDisplay();



// Interactable diagram ---------------------------------------------
// Configuration for the grid and images
const totalRows = 21;
const totalCols = 21;

// Path to the images folder and image file prefix
const imagePath = "images/Frame_";
const imageExtension = ".webp";

// Select the image element
const gridImage = document.getElementById("grid-image");

// Function to load image based on coordinates
function loadImage(row, col) {
    const imageIndex = row * totalCols + col;
    const imageNumber = String(imageIndex).padStart(5, "0"); // Format number with leading zeros
    gridImage.src = `${imagePath}${imageNumber}${imageExtension}`;
}

// Function to calculate and load the image based on X and Y position
function handleImageLoad(x, y) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate row and column based on position
    const col = Math.floor((x / windowWidth) * totalCols);
    const row = Math.floor((y / windowHeight) * totalRows);

    // Ensure indices are within bounds
    const boundedRow = Math.min(totalRows - 1, Math.max(0, row));
    const boundedCol = Math.min(totalCols - 1, Math.max(0, col));

    // Load the corresponding image
    loadImage(boundedRow, boundedCol);
}

// Event listener for mouse movement
document.addEventListener("mousemove", (event) => {
    handleImageLoad(event.clientX, event.clientY);
});

// Event listener for touch movement
document.addEventListener("touchmove", (event) => {
    // Prevent scrolling while dragging on touch devices
    event.preventDefault();
    const touch = event.touches[0];
    handleImageLoad(touch.clientX, touch.clientY);
});





// Highlight function -----------------------------------
document.getElementById('highlightButton').addEventListener('click', function() {
  let selection = window.getSelection(); // Get the selection object
  let selectedText = selection.toString(); // Get the selected text

  if (selectedText) {
      let range = selection.getRangeAt(0); // Get the selected range
      let span = document.createElement('span'); // Create a new span element
      span.className = 'highlighted'; // Apply the lime green style class
      range.surroundContents(span); // Wrap the selected text with the span
  }
});




// Facial recognition ---------------------------------------
// Get video element, canvas context, and toggle button
var videoInput = document.getElementById('inputVideo');
var canvasInput = document.getElementById('drawCanvas');
var cc = canvasInput.getContext('2d', { willReadFrequently: true });
var toggleButton = document.getElementById('toggleShape');

// Initialize the clmtrackr
var ctracker = new clm.tracker();
ctracker.init();

// Default shape is rectangle
var isRectangle = true;

// Declare variables for current and target widths
var currentWidth = 0;
var targetWidth = 0;
var transitionSpeed = 0.05; // Speed at which the width transitions

// Declare color transition variables
var currentOverlayColor = { r: 255, g: 255, b: 255, a: 0.96 }; // Start with white overlay
var targetOverlayColor = { r: 0, g: 0, b: 0, a: 0.7 }; // Target black overlay

// Function for smooth easing
function easeOutQuad(t) {
  return t * (2 - t);
}

// Access webcam and display the feed in the video element (in the background)
navigator.mediaDevices.getUserMedia({ video: true })
  .then(function(stream) {
    videoInput.srcObject = stream;
  })
  .catch(function(error) {
    console.log("Error accessing webcam: ", error);
  });

// Start the face tracker on the video element
ctracker.start(videoInput);

// Position Loop to get tracked face coordinates
function positionLoop() {
  requestAnimationFrame(positionLoop);

  // Get current positions of the tracked face
  var positions = ctracker.getCurrentPosition();
  if (positions) {
    // console.log(positions); // You can use this to see the face landmark positions

    // Calculate the vertical distance between the upper and lower eyelids for both eyes
    var leftUpperEyelid = positions[43];  // Upper eyelid of left eye
    var leftLowerEyelid = positions[47];  // Lower eyelid of left eye
    var rightUpperEyelid = positions[44]; // Upper eyelid of right eye
    var rightLowerEyelid = positions[48]; // Lower eyelid of right eye

    // Calculate the height of both eyes (vertical distance between upper and lower eyelids)
    var leftEyeHeight = Math.abs(leftUpperEyelid[1] - leftLowerEyelid[1]);
    var rightEyeHeight = Math.abs(rightUpperEyelid[1] - rightLowerEyelid[1]);

    // Calculate the midpoint between the eyes
    var leftEye = positions[27];  // Left eye landmark
    var rightEye = positions[32]; // Right eye landmark
    var midpointX = (leftEye[0] + rightEye[0]) / 2;
    var midpointY = (leftEye[1] + rightEye[1]) / 2;

    // Calculate the distance between the eyes (for scaling shape size)
    var eyeDistance = Math.sqrt(Math.pow(rightEye[0] - leftEye[0], 2) + Math.pow(rightEye[1] - leftEye[1], 2));

    // Calculate the angle between the eyes (for rotation)
    var angle = Math.atan2(rightEye[1] - leftEye[1], rightEye[0] - leftEye[0]);

    // Calculate the squint factor based on the eyelid distance (a higher squint factor makes the shape wider)
    var squintFactor = Math.max(1, 2 - Math.min(leftEyeHeight, rightEyeHeight) / 20); // Adjust the factor as needed
    var targetShapeWidth = eyeDistance * squintFactor;  // Target shape width based on eye distance and squint factor
    var shapeHeight = 30; // Set shape height (you can adjust this)

    // Smoothly transition the width to the target value using easing
    currentWidth += (targetShapeWidth - currentWidth) * transitionSpeed;

    // Calculate mouth corners distance and mouth height for smile detection
    var leftMouthCorner = positions[54];  // Left mouth corner
    var rightMouthCorner = positions[48]; // Right mouth corner
    var topMouth = positions[62];         // Top of the mouth (for height calculation)
    var bottomMouth = positions[66];      // Bottom of the mouth (for height calculation)

    var mouthWidth = Math.sqrt(Math.pow(rightMouthCorner[0] - leftMouthCorner[0], 2) + Math.pow(rightMouthCorner[1] - leftMouthCorner[1], 2)); // Horizontal distance
    var mouthHeight = Math.sqrt(Math.pow(topMouth[0] - bottomMouth[0], 2) + Math.pow(topMouth[1] - bottomMouth[1], 2)); // Vertical distance

    // Calculate smile ratio (width vs height)
    var smileRatio = mouthWidth / mouthHeight;

    // If the smile ratio exceeds a threshold, we consider it a smile
    var isSmiling = smileRatio > 0.75; // Adjust the threshold based on testing

    // Gradually transition the overlay color based on the smile detection (pink for smile, otherwise white/black)
    var targetOverlayColorTemp = isSmiling ? { r: 255, g: 105, b: 180, a: 0.7 } : (eyeDistance < 45 ? { r: 0, g: 0, b: 0, a: 0.7 } : { r: 255, g: 255, b: 255, a: 0.96 });

    // Smooth color transition for the overlay
    currentOverlayColor.r += (targetOverlayColorTemp.r - currentOverlayColor.r) * transitionSpeed;
    currentOverlayColor.g += (targetOverlayColorTemp.g - currentOverlayColor.g) * transitionSpeed;
    currentOverlayColor.b += (targetOverlayColorTemp.b - currentOverlayColor.b) * transitionSpeed;
    currentOverlayColor.a += (targetOverlayColorTemp.a - currentOverlayColor.a) * transitionSpeed;

    // Set the fillStyle to the interpolated RGBA color
    cc.fillStyle = `rgba(${Math.round(currentOverlayColor.r)}, ${Math.round(currentOverlayColor.g)}, ${Math.round(currentOverlayColor.b)}, ${currentOverlayColor.a})`;

    // Draw the overlay with the current color
    cc.fillRect(0, 0, canvasInput.width, canvasInput.height); // Fill the whole canvas

    // Draw the shape (rectangle or circle) based on the current mode
    cc.save();
    cc.translate(midpointX, midpointY); // Move the canvas context to the center of the shape
    cc.rotate(angle); // Rotate the context by the calculated angle

    if (isRectangle) {
      // Clear the area inside the rectangle before drawing
      cc.clearRect(-currentWidth / 2, -shapeHeight / 2, currentWidth, shapeHeight);

      // Draw a rectangle with the smoothly transitioning width
      cc.beginPath();
      cc.rect(-currentWidth / 2, -shapeHeight / 2, currentWidth, shapeHeight);
      cc.strokeStyle = 'black'; // Rectangle border color
      cc.lineWidth = 1; // Rectangle border width
      cc.stroke();
    } else {
      // Clear the area inside the circle before drawing
      cc.globalCompositeOperation = 'destination-out'; // Set compositing mode to clear
      cc.beginPath();
      cc.arc(0, 0, currentWidth / 2, 0, 2 * Math.PI);
      cc.fill(); // Fill the circle area to clear it
      cc.globalCompositeOperation = 'source-over'; // Reset compositing mode

      // Draw a circle
      cc.beginPath();
      cc.arc(0, 0, currentWidth / 2, 0, 2 * Math.PI);
      cc.strokeStyle = 'black'; // Circle border color
      cc.lineWidth = 0.1; // Circle border width
      cc.stroke();
    }

    cc.restore();

    // Draw the face landmarks on top of the white overlay (but outside the cleared area)
    ctracker.draw(canvasInput); // Draw face landmarks on canvas
  }
}

// Start the position loop
positionLoop();


// Toggle the shape when the button is clicked
toggleButton.addEventListener('click', function() {
  isRectangle = !isRectangle; // Toggle the shape mode (rectangle/circle)
});
