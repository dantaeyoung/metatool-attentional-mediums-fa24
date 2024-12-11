// Firebase configuration and initialization
document.addEventListener('DOMContentLoaded', () => {
    const firebaseConfig = {
        apiKey: "AIzaSyDrxEgJHzvHEeDBIIXiO3OUMiXr4u3b50g",
        authDomain: "gaze-tracker-b39a8.firebaseapp.com",
        databaseURL: "https://gaze-tracker-b39a8-default-rtdb.firebaseio.com",
        projectId: "gaze-tracker-b39a8",
        storageBucket: "gaze-tracker-b39a8.firebasestorage.app",
        messagingSenderId: "177766647597",
        appId: "1:177766647597:web:b50caaec3cb0784c9fb5a4",
        measurementId: "G-N6N4WPB86G"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const gyroDataRef = database.ref('angle');
    const defaultAnglesRef = database.ref('defaultAngles');
    const liveDataContainer = document.getElementById('live-data-container');
    const gazePatternContainer = document.getElementById('gaze-pattern-container');
    const gridItems = document.querySelectorAll('.grid-item');
    let currentHighlightedIndex = -1;
    let defaultAngles = {};
    let timers = {};
    let counts = {};
    let highlightedStates = {};
    let isTrackingActive = false; // Flag to track if tracking is active in the Gaze Tracker tab
    let isSetDefaultActive = false; // Flag for Set Default tab

    // Load recorded default angles from Firebase
    defaultAnglesRef.once('value', (snapshot) => {
        if (snapshot.exists()) {
            defaultAngles = snapshot.val();
        }
    });

    // Update live data and highlight corresponding grid
    gyroDataRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data && typeof data === 'object') {
                const x = data.x !== undefined ? Math.round(data.x) : 'N/A';
                const y = data.y !== undefined ? Math.round(data.y) : 'N/A';
                const z = data.z !== undefined ? Math.round(data.z) : 'N/A';
                liveDataContainer.innerHTML = `
                    <h2>Live Gyroscope Data</h2>
                    <p>X: ${x}&#176;</p>
                    <p>Y: ${y}&#176;</p>
                    <p>Z: ${z}&#176;</p>
                `;
                const gazePattern = identifyClosestGazePattern(x, y, z, defaultAngles);
                gazePatternContainer.innerHTML = `<h2>Gaze Pattern</h2><p>${gazePattern}</p>`;
                highlightGazePattern(gazePattern, x, y, z);
                
                // Update the visualization section
                document.getElementById('current-gaze-pattern').textContent = `Gaze Pattern: ${gazePattern}`;
                const gridKey = gazePattern.toLowerCase().replace(/ /g, '-'); // Assuming gridKey is derived from gazePattern
                document.getElementById('current-count').textContent = `Count: ${counts[gridKey] || 0}`;
                document.getElementById('current-time').textContent = `Time: ${timers[gridKey]?.elapsedTime || 0}s`;
            } else {
                liveDataContainer.innerHTML = `<p>Unexpected data format received from Firebase.</p>`;
                gazePatternContainer.innerHTML = `<p>Unable to determine gaze pattern.</p>`;
            }
        } else {
            liveDataContainer.innerHTML = `<p>No data available</p>`;
            gazePatternContainer.innerHTML = `<p>No data available</p>`;
        }
    }, (error) => {
        liveDataContainer.innerHTML = `<p>Error retrieving data: ${error.message}</p>`;
        gazePatternContainer.innerHTML = `<p>Error retrieving gaze pattern data: ${error.message}</p>`;
    });

    // Function to determine the closest gaze pattern
    function identifyClosestGazePattern(x, y, z, defaultAngles) {
        if (Object.keys(defaultAngles).length === 0) {
            console.error("Default angles are empty.");
            return "Unknown";
        }
        let closestPattern = "Unknown";
        let smallestDistance = Infinity;

        for (const [pattern, angles] of Object.entries(defaultAngles)) {
            const distance = Math.sqrt((x - angles.x) ** 2 + (y - angles.y) ** 2 + (z - angles.z) ** 2);
            if (distance < smallestDistance) {
                smallestDistance = distance;
                closestPattern = pattern;
            }
        }
        return closestPattern.replace(/-/g, ' ').toUpperCase();
    }

    // Function to highlight the grid item based on gaze pattern
    function highlightGazePattern(gazePattern, x, y, z) {
        if (!isTrackingActive) return; // Exit if tracking is not active in Gaze Tracker tab

        // Check if default angles are recorded
        if (Object.keys(defaultAngles).length === 0) {
            console.error("Default angles are not recorded.");
            return;
        }

        gridItems.forEach(item => {
            const label = item.querySelector('.label');
            const gridKey = item.dataset.gaze;
            const isHighlighted = label && label.textContent.trim().toUpperCase() === gazePattern.trim().toUpperCase();

            if (isHighlighted) {
                if (!highlightedStates[gridKey]) {
                    // Increment count only once per highlight
                    counts[gridKey] = (counts[gridKey] || 0) + 1;
                    highlightedStates[gridKey] = true;
                }

                // Resume the timer from the last recorded elapsed time or continue if already running
                const previousElapsedTime = timers[gridKey]?.elapsedTime || 0;
                if (!timers[gridKey] || !timers[gridKey].interval) {
                    timers[gridKey] = { startTime: Date.now() - previousElapsedTime * 1000, interval: null, elapsedTime: previousElapsedTime };
                    timers[gridKey].interval = setInterval(() => {
                        const elapsedTime = Math.floor((Date.now() - timers[gridKey].startTime) / 1000);
                        timers[gridKey].elapsedTime = elapsedTime;
                        const timeRect = item.querySelector('.time-rect');
                        timeRect.textContent = `Time: ${elapsedTime}s`;
                    }, 1000);
                }

                const img = item.querySelector('img');
                if (img) {
                    img.style.filter = 'invert(1)';
                }

            } else {
                if (highlightedStates[gridKey]) {
                    highlightedStates[gridKey] = false;
                    if (timers[gridKey] && timers[gridKey].interval) {
                        clearInterval(timers[gridKey].interval);
                        timers[gridKey].interval = null; // Pause the timer without resetting
                    }
                }

                const img = item.querySelector('img');
                if (img) {
                    img.style.filter = 'none';
                }
            }

            item.style.boxShadow = isHighlighted ? '0 0 15px 5px green' : 'none';

            const countRect = item.querySelector('.count-rect');
            const timeRect = item.querySelector('.time-rect');

            if (document.querySelector('.active').id === 'gaze-tracker-tab') {
                countRect.textContent = `Count: ${counts[gridKey] || 0}`;
            }

            countRect.style.display = document.querySelector('.active').id === 'gaze-tracker-tab' ? 'block' : 'none';
            timeRect.style.display = document.querySelector('.active').id === 'gaze-tracker-tab' ? 'block' : 'none';
        });
    }

    // Function to handle tab visibility for buttons
    function updateGridItemVisibility(tab) {
        gridItems.forEach(item => {
            const recordButton = item.querySelector('.record-button');
            const countRect = item.querySelector('.count-rect');
            const timeRect = item.querySelector('.time-rect');

            if (tab === 'about' || tab === 'setDefault') {
                if (recordButton) recordButton.style.display = tab === 'setDefault' ? 'block' : 'none';
                if (countRect) countRect.style.display = 'none';
                if (timeRect) timeRect.style.display = 'none';

                // Stop all timers when not in gazeTracker tab
                const gridKey = item.dataset.gaze;
                if (timers[gridKey]) {
                    clearInterval(timers[gridKey].interval);
                    timers[gridKey].interval = null;
                }
            } else if (tab === 'gazeTracker') {
                if (recordButton) recordButton.style.display = 'none';
                if (countRect) countRect.style.display = 'block';
                if (timeRect) timeRect.style.display = 'block';
            }
        });
    }

    // Button functionality
    const startButton = document.getElementById('start-button');
    const resetAllButton = document.getElementById('reset-all-button');
    const startGazeTrackingButton = document.getElementById('start-gaze-tracking-button');

    startButton.addEventListener('click', () => {
        document.getElementById('about-container').style.display = 'none';
        document.getElementById('gaze-tracker-container').style.display = 'block';
        document.getElementById('set-default-container').style.display = 'none';
    });

    resetAllButton.addEventListener('click', () => {
        defaultAnglesRef.remove();
        gridItems.forEach(item => {
            const recordButton = item.querySelector('.record-button');
            if (recordButton) {
                recordButton.textContent = 'Record';
            }
        });
    });

    // Tab button functionality
    const aboutTab = document.getElementById('about-tab');
    const setDefaultTab = document.getElementById('set-default-tab');
    const gazeTrackerTab = document.getElementById('gaze-tracker-tab');

    aboutTab.addEventListener('click', () => {
        document.getElementById('about-container').style.display = 'block';
        document.getElementById('gaze-tracker-container').style.display = 'none';
        document.getElementById('set-default-container').style.display = 'none';
        setDefaultTab.classList.remove('active');
        gazeTrackerTab.classList.remove('active');
        aboutTab.classList.add('active');
        updateGridItemVisibility('about');
    });

    setDefaultTab.addEventListener('click', () => {
        document.getElementById('about-container').style.display = 'none';
        document.getElementById('gaze-tracker-container').style.display = 'none';
        document.getElementById('set-default-container').style.display = 'block';
        setDefaultTab.classList.add('active');
        gazeTrackerTab.classList.remove('active');
        aboutTab.classList.remove('active');
        updateGridItemVisibility('setDefault');

        // Load and display recorded angles
        defaultAnglesRef.once('value', (snapshot) => {
            if (snapshot.exists()) {
                const angles = snapshot.val();
                gridItems.forEach(item => {
                    const gridKey = item.dataset.gaze;
                    const recordButton = item.querySelector('.record-button');
                    if (angles[gridKey] && recordButton) {
                        recordButton.textContent = `X=${angles[gridKey].x}, Y=${angles[gridKey].y}, Z=${angles[gridKey].z}`;
                    }
                });
            }
        });
    });

    gazeTrackerTab.addEventListener('click', () => {
        document.getElementById('about-container').style.display = 'none';
        document.getElementById('gaze-tracker-container').style.display = 'block';
        document.getElementById('set-default-container').style.display = 'none';
        setDefaultTab.classList.remove('active');
        gazeTrackerTab.classList.add('active');
        aboutTab.classList.remove('active');
        updateGridItemVisibility('gazeTracker');
    });

    // Recording default angles functionality
    gridItems.forEach(item => {
        const recordButton = item.querySelector('.record-button');
        recordButton?.addEventListener('click', () => {
            if (recordButton.style.display === 'block') {
                gyroDataRef.once('value', (snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        if (data && typeof data === 'object') {
                            const gridKey = item.dataset.gaze;
                            const angles = { x: Math.round(data.x), y: Math.round(data.y), z: Math.round(data.z) };
                            defaultAnglesRef.child(gridKey).set(angles);
                            recordButton.textContent = `X=${angles.x}, Y=${angles.y}, Z=${angles.z}`;
                        } else {
                            recordButton.textContent = 'Recording failed. Try again.';
                        }
                    }
                }, (error) => {
                    recordButton.textContent = `Error: ${error.message}`;
                });
            }
        });
    });

    // Start Gaze Tracking button functionality in Set Default tab
    startGazeTrackingButton.addEventListener('click', () => {
        isSetDefaultActive = true; // Enable Set Default tracking

        // Switch to Gaze Tracker tab
        document.getElementById('about-container').style.display = 'none';
        document.getElementById('gaze-tracker-container').style.display = 'block';
        document.getElementById('set-default-container').style.display = 'none';
        setDefaultTab.classList.remove('active');
        gazeTrackerTab.classList.add('active');
        aboutTab.classList.remove('active');
        updateGridItemVisibility('gazeTracker');
    });

    const startTrackingButton = document.getElementById('start-button');
    const resetTrackingButton = document.getElementById('reset-button');

    // Start Tracking button functionality in Gaze Tracker tab
    startTrackingButton.addEventListener('click', () => {
        // Check if default angles are recorded
        if (Object.keys(defaultAngles).length === 0) {
            console.error("Default angles are not recorded. Timers will not start.");
            return;
        }

        isTrackingActive = true; // Enable tracking

        gridItems.forEach(item => {
            const gridKey = item.dataset.gaze;
            const label = item.querySelector('.label');
            const isHighlighted = label && label.textContent.trim().toUpperCase() === identifyClosestGazePattern(x, y, z, defaultAngles).trim().toUpperCase();

            if (isHighlighted) {
                // Initialize count
                counts[gridKey] = counts[gridKey] || 0;
                const countRect = item.querySelector('.count-rect');
                countRect.textContent = `Count: ${counts[gridKey]}`;

                // Start the timer only if it hasn't been started yet
                if (!timers[gridKey]) {
                    const previousElapsedTime = timers[gridKey]?.elapsedTime || 0;
                    timers[gridKey] = { startTime: Date.now() - previousElapsedTime * 1000, interval: null, elapsedTime: previousElapsedTime };
                    timers[gridKey].interval = setInterval(() => {
                        const elapsedTime = Math.floor((Date.now() - timers[gridKey].startTime) / 1000);
                        timers[gridKey].elapsedTime = elapsedTime;
                        const timeRect = item.querySelector('.time-rect');
                        timeRect.textContent = `Time: ${elapsedTime}s`;
                    }, 1000);
                }
            }
        });
    });

    // Reset Tracking button functionality
    resetTrackingButton.addEventListener('click', () => {
        isTrackingActive = false; // Disable tracking

        gridItems.forEach(item => {
            const gridKey = item.dataset.gaze;
            const timeRect = item.querySelector('.time-rect');
            const countRect = item.querySelector('.count-rect');

            // Reset count
            counts[gridKey] = 0;
            countRect.textContent = `Count: ${counts[gridKey]}`;

            // Reset timer
            if (timers[gridKey]) {
                clearInterval(timers[gridKey].interval);
                timers[gridKey] = null;
            }
            timeRect.textContent = `Time: 0s`;

            // Remove highlight
            item.style.boxShadow = 'none';
            highlightedStates[gridKey] = false;
        });
    });

    const instructionButtons = document.querySelectorAll('.instructions-buttons button');
    const instructionBox = document.getElementById('instruction-box');

    // Instructions for each step
    const instructions = {
        step1: 'Step 1: Wear the Headband<br>Wear the headband in a comfortable position, ensuring it fits snugly but not too tight.',
        step2: 'Step 2: Reset Default Angles<br>If default angles are already visible, click the \'Reset All\' button to restart the process.',
        step3: 'Step 3: Record Middle Center Gaze<br>Start with the middle center gaze pattern. Look naturally and comfortably, then click \'Record\' to set your default angle.',
        step4: 'Step 4: Record All Gaze Patterns<br>Repeat the recording process for all remaining gaze patterns to complete the setup.',
        step5: 'Step 5: Verify Default Angles<br>Review your recorded angles. If not satisfied, re-record until you’re comfortable with the default settings. Once done, click the \'Start Gazing\' button.',
        step6: 'Step 6: Check Live Gyroscope Data<br>Confirm that real-time updates of your gaze pattern are visible under \'Live Gyroscope Data.\'',
        step7: 'Step 7: Begin Gaze Tracking<br>Click the \'Start Tracking\' button when ready to track your gaze pattern.',
        step8: 'Step 8: Wait for Tracking<br>Allow a few seconds for tracking to appear on the right side of the screen. If tracking doesn’t start, reload the page.',
        step9: 'Step 9: View Real-Time Tracking<br>Monitor your real-time gaze pattern tracking, including the gaze pattern count and time.',
        step10: 'Step 10: Explore Visualizations<br>To better understand how your gaze patterns relate to specific activities, review the accompanying visualizations.'
    };

    // Function to display the default message in the instruction box
    function displayDefaultMessage() {
        instructionBox.innerHTML = '<p>Click on the Steps to see the instructions</p>';
    }

    // Add click event listener for the Set Default tab
    setDefaultTab.addEventListener('click', () => {
        displayDefaultMessage(); // Show the default message when the Set Default tab is clicked
    });

    // Add click event listeners to each button
    instructionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const step = button.id.split('-')[1]; // Extract step number from button ID
            instructionBox.innerHTML = `<p>${instructions[`step${step}`]}</p>`;
        });
    });
});

