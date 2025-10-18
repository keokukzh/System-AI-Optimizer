# OptiAI Manual Testing Checklist

## Test Environment Setup
- **OS**: Windows 10/11
- **RAM**: 8GB+ recommended
- **Storage**: 1GB+ free space
- **Test Date**: ___________
- **Tester**: ___________

## Phase 1: Application Launch and Initialization

### 1.1 First Run Setup
- [ ] **Application launches successfully**
  - [ ] Window opens with correct title "OptiAI - System Optimizer"
  - [ ] Window size is 1200x800 (or resized appropriately)
  - [ ] No console errors in DevTools
  - [ ] Application icon displays correctly

- [ ] **First-run initialization**
  - [ ] Settings file created in `%APPDATA%\OptiAI\settings.json`
  - [ ] System profile collected and saved
  - [ ] Default settings applied (dark theme, English language)
  - [ ] No error messages during initialization

- [ ] **DevTools availability (Development mode only)**
  - [ ] DevTools open automatically in development mode
  - [ ] Console shows no critical errors
  - [ ] Network tab shows no failed requests

### 1.2 Subsequent Launches
- [ ] **Application remembers settings**
  - [ ] Window size and position restored
  - [ ] Theme preference maintained
  - [ ] Previous scan results available
  - [ ] Settings persist across restarts

## Phase 2: Dashboard and System Metrics

### 2.1 Real-time Metrics Display
- [ ] **CPU Metrics**
  - [ ] CPU usage percentage displays correctly (0-100%)
  - [ ] CPU usage updates every 10 seconds
  - [ ] CPU usage reflects actual system load
  - [ ] CPU count displays correctly

- [ ] **Memory Metrics**
  - [ ] Total memory displays correctly (GB)
  - [ ] Memory usage percentage accurate (0-100%)
  - [ ] Memory usage updates in real-time
  - [ ] Memory values match Task Manager

- [ ] **Disk Metrics**
  - [ ] Disk usage percentage accurate
  - [ ] Total and available space correct
  - [ ] Disk information updates properly
  - [ ] Multiple drives shown if present

- [ ] **Network Metrics**
  - [ ] Network activity displays (bytes sent/received)
  - [ ] Network metrics update in real-time
  - [ ] Network status indicator works

### 2.2 Status Indicators
- [ ] **AI Status**
  - [ ] Shows "online" when LLM is available
  - [ ] Shows "offline" when LLM is unavailable
  - [ ] Status updates correctly
  - [ ] No false positives/negatives

- [ ] **Backend Status**
  - [ ] Always shows "online" in Tauri mode
  - [ ] Status indicator is green
  - [ ] No connection errors

- [ ] **Network Status**
  - [ ] Shows "online" when connected
  - [ ] Shows "offline" when disconnected
  - [ ] Updates automatically

## Phase 3: System Scanning

### 3.1 Directory Selection
- [ ] **Scan path selection**
  - [ ] Can select directories via file picker
  - [ ] Can manually enter directory paths
  - [ ] Path validation works (invalid paths rejected)
  - [ ] Default scan directories work (C:\)

### 3.2 Scan Execution
- [ ] **Scan initiation**
  - [ ] "Start Scan" button works
  - [ ] Progress indicator appears
  - [ ] Scan can be cancelled
  - [ ] No crashes during scanning

- [ ] **Scan progress**
  - [ ] Progress bar updates
  - [ ] File count increases during scan
  - [ ] Scan time displays correctly
  - [ ] Large directories don't freeze UI

### 3.3 Scan Results
- [ ] **Results display**
  - [ ] Scan results show in table format
  - [ ] File count matches actual files
  - [ ] File sizes are accurate
  - [ ] File types categorized correctly

- [ ] **Treemap visualization**
  - [ ] Treemap renders correctly
  - [ ] File sizes represented proportionally
  - [ ] Can click on treemap sections
  - [ ] Breadcrumb navigation works

- [ ] **Duplicate detection**
  - [ ] Duplicate files identified
  - [ ] Duplicate groups displayed
  - [ ] File hashes calculated correctly
  - [ ] Duplicate count accurate

## Phase 4: AI Suggestions

### 4.1 AI Suggestion Generation
- [ ] **Suggestion creation**
  - [ ] "Generate AI Suggestions" button works
  - [ ] Suggestions appear after scan completion
  - [ ] Suggestion count is reasonable
  - [ ] No infinite loading states

- [ ] **Suggestion content**
  - [ ] Suggestions have descriptive titles
  - [ ] Descriptions are helpful and accurate
  - [ ] Confidence scores display (0.0-1.0)
  - [ ] Categories are appropriate (cleanup, optimization, etc.)

### 4.2 Suggestion Display
- [ ] **Suggestion cards**
  - [ ] Cards display properly with glassmorphism design
  - [ ] Risk badges show correct colors (green/yellow/red)
  - [ ] Confidence indicators work
  - [ ] Category filters function

- [ ] **Suggestion actions**
  - [ ] Can expand/collapse suggestion details
  - [ ] Can dismiss suggestions
  - [ ] Can apply suggestions (if implemented)
  - [ ] Undo functionality works

## Phase 5: Process Management (Processes.tsx)

### 5.1 Process List Display
- [ ] **Process listing**
  - [ ] All running processes displayed
  - [ ] Process names are accurate
  - [ ] PIDs are correct
  - [ ] CPU percentages update in real-time

- [ ] **Process information**
  - [ ] Memory usage displays correctly
  - [ ] Process status shows accurately
  - [ ] Process count matches Task Manager
  - [ ] System processes included

### 5.2 Process Management
- [ ] **Process filtering**
  - [ ] Search by process name works
  - [ ] Filter by CPU usage works
  - [ ] Filter by memory usage works
  - [ ] Sort by different columns works

- [ ] **Process actions**
  - [ ] Can kill processes (with confirmation)
  - [ ] Confirmation dialog appears
  - [ ] Process actually terminates
  - [ ] Error handling for protected processes

## Phase 6: Startup Management (Startup.tsx)

### 6.1 Startup Program Display
- [ ] **Startup program listing**
  - [ ] Windows startup programs displayed
  - [ ] Program names are accurate
  - [ ] File paths are correct
  - [ ] Enabled/disabled status accurate

- [ ] **Startup program information**
  - [ ] Registry location shown
  - [ ] Startup folder programs included
  - [ ] Program count matches system
  - [ ] No duplicate entries

### 6.2 Startup Program Management
- [ ] **Toggle functionality**
  - [ ] Can enable/disable startup programs
  - [ ] Changes persist after restart
  - [ ] Registry entries updated correctly
  - [ ] Confirmation for system programs

- [ ] **Startup program actions**
  - [ ] Can remove startup entries
  - [ ] Can add new startup programs
  - [ ] Error handling for permission issues
  - [ ] Changes reflected immediately

## Phase 7: Settings and Storage

### 7.1 Settings Management
- [ ] **Settings persistence**
  - [ ] Settings saved to `%APPDATA%\OptiAI\settings.json`
  - [ ] Settings load correctly on startup
  - [ ] Changes persist across restarts
  - [ ] Default settings work

- [ ] **Settings categories**
  - [ ] Theme settings (dark/light/auto)
  - [ ] Language settings
  - [ ] Scan preferences
  - [ ] Notification settings
  - [ ] AI settings

### 7.2 Data Storage
- [ ] **Scan result storage**
  - [ ] Scan results saved to `%APPDATA%\OptiAI\scans\`
  - [ ] Scan results load correctly
  - [ ] Multiple scan results preserved
  - [ ] Scan history maintained

- [ ] **System profile storage**
  - [ ] System profile saved to `%APPDATA%\OptiAI\system_profile.json`
  - [ ] Profile information accurate
  - [ ] Profile updates when system changes
  - [ ] Profile loads on startup

## Phase 8: Error Handling and Edge Cases

### 8.1 Invalid Input Handling
- [ ] **Invalid directory paths**
  - [ ] Non-existent directories rejected
  - [ ] Permission denied errors handled
  - [ ] Network paths handled appropriately
  - [ ] Error messages are user-friendly

- [ ] **Invalid process operations**
  - [ ] Cannot kill system processes
  - [ ] Permission errors handled gracefully
  - [ ] Invalid PIDs rejected
  - [ ] Error messages informative

### 8.2 Network and Connectivity
- [ ] **Offline scenarios**
  - [ ] Application works without internet
  - [ ] Network status updates correctly
  - [ ] No crashes when offline
  - [ ] Graceful degradation of features

- [ ] **Connection issues**
  - [ ] Handles network timeouts
  - [ ] Retries failed operations
  - [ ] User feedback for connection issues
  - [ ] No infinite loading states

### 8.3 Resource Constraints
- [ ] **High system load**
  - [ ] Application remains responsive
  - [ ] No memory leaks during long sessions
  - [ ] CPU usage reasonable during idle
  - [ ] Large directory scans don't crash

- [ ] **Low disk space**
  - [ ] Handles low disk space gracefully
  - [ ] Can't write to full drives
  - [ ] Error messages for disk space issues
  - [ ] Application doesn't crash

## Phase 9: Performance Testing

### 9.1 Application Performance
- [ ] **Startup time**
  - [ ] Application starts within 3 seconds
  - [ ] No long loading screens
  - [ ] UI appears quickly
  - [ ] Metrics load promptly

- [ ] **Memory usage**
  - [ ] Memory usage under 200MB during idle
  - [ ] Memory usage under 500MB during active scan
  - [ ] No memory leaks over time
  - [ ] Memory usage reasonable for features

### 9.2 Operation Performance
- [ ] **Metrics collection**
  - [ ] Metrics update within 1 second
  - [ ] No UI freezing during updates
  - [ ] Smooth animations
  - [ ] Responsive interface

- [ ] **Scan performance**
  - [ ] Small directories (< 1000 files) scan in < 5 seconds
  - [ ] Medium directories (< 10000 files) scan in < 30 seconds
  - [ ] Large directories show progress
  - [ ] Scan can be cancelled quickly

## Phase 10: User Experience

### 10.1 UI/UX Quality
- [ ] **Visual design**
  - [ ] Glassmorphism design implemented
  - [ ] Colors are consistent
  - [ ] Icons are clear and appropriate
  - [ ] Layout is intuitive

- [ ] **Responsiveness**
  - [ ] UI adapts to window resizing
  - [ ] Components scale appropriately
  - [ ] No layout breaking
  - [ ] Mobile-friendly (if applicable)

### 10.2 Accessibility
- [ ] **Keyboard navigation**
  - [ ] Tab navigation works
  - [ ] Enter key activates buttons
  - [ ] Escape key closes dialogs
  - [ ] Arrow keys work in lists

- [ ] **Screen reader compatibility**
  - [ ] Alt text for images
  - [ ] Proper heading structure
  - [ ] Form labels associated
  - [ ] Status messages announced

## Test Results Summary

### Overall Assessment
- **Total Tests**: 150+
- **Passed**: _____
- **Failed**: _____
- **Critical Issues**: _____
- **Minor Issues**: _____

### Critical Issues Found
1. ________________________________
2. ________________________________
3. ________________________________

### Minor Issues Found
1. ________________________________
2. ________________________________
3. ________________________________

### Performance Notes
- **Average startup time**: _____ seconds
- **Peak memory usage**: _____ MB
- **Largest directory scanned**: _____ files
- **Longest scan time**: _____ seconds

### Recommendations
1. ________________________________
2. ________________________________
3. ________________________________

### Sign-off
- **Tester**: ________________________
- **Date**: ________________________
- **Status**: [ ] PASS [ ] FAIL [ ] CONDITIONAL PASS
- **Notes**: ________________________________

---

## Test Execution Notes

### Environment Details
- **OS Version**: ________________________
- **RAM**: ________________________
- **CPU**: ________________________
- **Storage**: ________________________
- **Antivirus**: ________________________

### Test Data
- **Test Directories**: ________________________
- **Test Files**: ________________________
- **Test Processes**: ________________________

### Additional Observations
________________________________
________________________________
________________________________
