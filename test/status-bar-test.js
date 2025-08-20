/**
 * Status Bar Test Utility
 * Run this in browser console to test the status bar layout and behavior
 */

function testStatusBarLayout() {
  // Check if status bar exists
  const statusBar = document.getElementById('status-bar');
  if (!statusBar) {
    console.error('❌ Status bar not found in the DOM');
    return false;
  }
  
  // Check if status bar is positioned at the bottom
  const statusBarRect = statusBar.getBoundingClientRect();
  const isAtBottom = Math.abs(window.innerHeight - statusBarRect.bottom) < 5;
  
  if (!isAtBottom) {
    console.error('❌ Status bar is not positioned at the bottom of the viewport');
    return false;
  }
  
  // Check if status bar is in a single line
  const container = statusBar.querySelector('.status-container');
  const isSingleLine = container.scrollHeight <= statusBar.offsetHeight;
  
  if (!isSingleLine) {
    console.error('❌ Status bar is not in a single line');
    return false;
  }
  
  // Check z-index and layering
  const zIndex = parseInt(window.getComputedStyle(statusBar).zIndex);
  if (zIndex < 1000) {
    console.error('❌ Status bar z-index is too low. It should be above other content.');
    return false;
  }
  
  // Check if status items are properly aligned
  const statusItems = statusBar.querySelectorAll('.status-item');
  let allItemsAligned = true;
  
  statusItems.forEach((item, index) => {
    const itemRect = item.getBoundingClientRect();
    if (Math.abs(itemRect.top - statusBarRect.top) > 5) {
      console.error(`❌ Status item ${index} is not properly aligned`);
      allItemsAligned = false;
    }
  });
  
  if (!allItemsAligned) {
    return false;
  }
  
  console.log('✅ Status bar layout test passed!');
  return true;
}

// Run the test
console.log('Running status bar layout test...');
const testPassed = testStatusBarLayout();

// Add visual indicator
if (testPassed) {
  const style = document.createElement('style');
  style.textContent = `
    #status-bar::after {
      content: '✅ Test Passed';
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #4caf50;
      font-weight: bold;
      z-index: 1001;
    }
  `;
  document.head.appendChild(style);
  
  // Flash the status bar green to indicate success
  const statusBar = document.getElementById('status-bar');
  statusBar.style.transition = 'background-color 0.5s';
  statusBar.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
  setTimeout(() => {
    statusBar.style.backgroundColor = '';
  }, 1000);
} else {
  console.log('❌ Some tests failed. Check the console for details.');
}
