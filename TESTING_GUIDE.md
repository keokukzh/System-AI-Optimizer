# OptiAI Testing Guide

This guide covers the comprehensive testing strategy for OptiAI, including unit tests, integration tests, end-to-end tests, performance tests, and security tests.

## Overview

OptiAI uses a multi-layered testing approach to ensure reliability, performance, and security:

- **Unit Tests**: Individual component testing
- **Integration Tests**: Component interaction testing
- **End-to-End Tests**: Full application flow testing
- **Performance Tests**: Load and performance validation
- **Security Tests**: Vulnerability and security assessment
- **Docker Tests**: Containerized testing environment

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── test_application_flow.js
│   ├── global-setup.js
│   └── global-teardown.js
├── performance/            # Performance tests
│   └── test_performance.py
├── security/              # Security tests
│   └── test_security.py
├── integration/           # Integration tests
│   └── test_integration.py
└── data/                  # Test data
    ├── test-data.json
    └── mock-llm-responses.json
```

## Quick Start

### 1. Install Test Dependencies

```bash
make test-install
```

This installs:
- Playwright for E2E testing
- pytest for Python testing
- Selenium for browser automation
- Performance testing tools

### 2. Run All Tests

```bash
make test-all
```

This runs the comprehensive test suite including:
- Frontend unit tests
- Backend unit tests
- Integration tests
- E2E tests
- Performance tests
- Security tests

### 3. Run Specific Test Types

```bash
# Basic tests only
make test

# End-to-end tests
make test-e2e

# Performance tests
make test-performance

# Security tests
make test-security

# Docker-based tests
make test-docker
```

## Test Types

### Unit Tests

**Frontend Tests**
- Component rendering
- User interactions
- State management
- API integration

**Backend Tests**
- API endpoints
- Business logic
- Data validation
- Error handling

```bash
# Run frontend tests
npm test

# Run backend tests
cd backend && python -m pytest tests/ -v
```

### Integration Tests

Tests the interaction between different components:

- Frontend ↔ Backend communication
- Database operations
- File system operations
- LLM integration
- Process management

```bash
python -m pytest tests/integration/ -v
```

### End-to-End Tests

Full application flow testing using Playwright:

- Application startup
- User workflows
- Complete optimization process
- Error scenarios
- Cross-browser compatibility

```bash
npx playwright test
```

**E2E Test Features:**
- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile device testing
- Screenshot capture on failure
- Video recording
- Trace collection
- Parallel execution

### Performance Tests

Validates application performance under various conditions:

- Startup time
- Response times
- Memory usage
- CPU usage
- Concurrent load
- Large data handling

```bash
python -m pytest tests/performance/ -v
```

**Performance Thresholds:**
- Startup time: < 5 seconds
- API response time: < 2 seconds
- Memory usage: < 200MB
- CPU usage: < 50%
- Scan time: < 30 seconds

### Security Tests

Comprehensive security vulnerability assessment:

- SQL injection protection
- XSS protection
- Path traversal protection
- Command injection protection
- Authentication security
- Input validation
- Rate limiting
- CORS security

```bash
python -m pytest tests/security/ -v
```

## Docker Testing

### Docker Test Environment

The Docker testing environment provides:

- Isolated test environment
- Consistent test conditions
- Multi-service testing
- Automated test execution
- Test result aggregation

```bash
# Build and run Docker tests
docker-compose -f docker-compose.test.yml up --build

# Run specific test service
docker-compose -f docker-compose.test.yml run integration-test

# View test results
docker-compose -f docker-compose.test.yml run test-results
```

### Docker Services

- **frontend-test**: Frontend testing service
- **backend-test**: Backend testing service
- **integration-test**: Integration testing service
- **playwright-test**: E2E testing with Playwright
- **performance-test**: Performance testing service
- **security-test**: Security testing service
- **mock-llm-server**: Mock LLM server for testing
- **test-db**: Test database
- **test-redis**: Test cache
- **selenium-hub**: Selenium Grid for browser testing

## Test Configuration

### Playwright Configuration

The `playwright.config.js` file configures:

- Test directories
- Browser projects
- Test timeouts
- Screenshot settings
- Video recording
- Trace collection
- Global setup/teardown

### Test Data

Test data is managed in `tests/data/`:

- **test-data.json**: Standard test data
- **mock-llm-responses.json**: Mock LLM responses
- **performance-data.json**: Performance test data
- **security-payloads.json**: Security test payloads

### Environment Variables

Test environment variables:

```bash
# Test URLs
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:5174
LLM_SERVER_URL=http://localhost:11435

# Test configuration
TEST_MODE=true
TEST_DATA_DIR=./tests/data
TEST_RESULTS_DIR=./test-results

# Performance thresholds
PERFORMANCE_TIMEOUT=30000
MEMORY_THRESHOLD=200
CPU_THRESHOLD=50
```

## Test Execution

### Local Testing

1. **Start Services**
   ```bash
   # Terminal 1: Backend
   cd backend && python -m uvicorn main:app --reload --port 5174
   
   # Terminal 2: Frontend
   npm run dev
   ```

2. **Run Tests**
   ```bash
   # All tests
   make test-all
   
   # Specific test type
   make test-e2e
   ```

### CI/CD Testing

The test suite is designed for CI/CD integration:

```yaml
# GitHub Actions example
- name: Run Tests
  run: |
    make test-install
    make test-all
    
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/
```

### Docker Testing

```bash
# Full Docker test suite
make test-docker

# Specific Docker test
docker-compose -f docker-compose.test.yml run playwright-test
```

## Test Results

### Test Reports

Test results are generated in multiple formats:

- **HTML Report**: `test-results/html/index.html`
- **JSON Report**: `test-results/results.json`
- **JUnit Report**: `test-results/results.xml`
- **Test Summary**: `test-results/test-summary.json`

### Test Artifacts

- **Screenshots**: Captured on test failures
- **Videos**: Recorded for E2E tests
- **Traces**: Playwright traces for debugging
- **Logs**: Detailed test execution logs

### Performance Metrics

Performance test results include:

- Response times
- Memory usage
- CPU usage
- Throughput
- Error rates
- Resource utilization

## Debugging Tests

### Test Debugging

1. **Run Tests in Debug Mode**
   ```bash
   # Playwright debug mode
   npx playwright test --debug
   
   # Python debug mode
   python -m pytest tests/ -v -s --pdb
   ```

2. **View Test Results**
   ```bash
   # Open HTML report
   open test-results/html/index.html
   
   # View test logs
   cat test-results/test.log
   ```

3. **Docker Debugging**
   ```bash
   # Run interactive container
   docker-compose -f docker-compose.test.yml run --rm integration-test bash
   
   # View container logs
   docker-compose -f docker-compose.test.yml logs integration-test
   ```

### Common Issues

**Tests Failing to Start**
- Check if services are running
- Verify port availability
- Check test dependencies

**E2E Tests Failing**
- Update Playwright browsers: `npx playwright install`
- Check browser compatibility
- Verify test selectors

**Performance Tests Failing**
- Check system resources
- Adjust performance thresholds
- Verify test data size

**Security Tests Failing**
- Update security payloads
- Check security configurations
- Verify input validation

## Best Practices

### Test Writing

1. **Write Clear Test Names**
   ```javascript
   test('should display system metrics on dashboard load', async ({ page }) => {
     // Test implementation
   });
   ```

2. **Use Descriptive Assertions**
   ```python
   assert response.status_code == 200, f"API endpoint failed: {response.status_code}"
   ```

3. **Test Edge Cases**
   - Empty inputs
   - Invalid data
   - Network failures
   - Resource constraints

4. **Keep Tests Independent**
   - No test dependencies
   - Clean state between tests
   - Isolated test data

### Test Maintenance

1. **Regular Updates**
   - Update test dependencies
   - Refresh test data
   - Update performance thresholds

2. **Test Monitoring**
   - Track test execution time
   - Monitor test success rates
   - Analyze test failures

3. **Test Optimization**
   - Parallel test execution
   - Efficient test data
   - Minimal test setup

## Continuous Integration

### GitHub Actions

```yaml
name: OptiAI Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
        
    - name: Install dependencies
      run: make test-install
      
    - name: Run tests
      run: make test-all
      
    - name: Upload test results
      uses: actions/upload-artifact@v3
      with:
        name: test-results
        path: test-results/
```

### Test Automation

- **Scheduled Tests**: Daily test runs
- **PR Testing**: Automatic testing on pull requests
- **Release Testing**: Comprehensive testing before releases
- **Performance Monitoring**: Continuous performance tracking

## Support

### Getting Help

1. **Check Test Logs**: Review test execution logs
2. **View Test Reports**: Analyze HTML test reports
3. **Debug Mode**: Run tests in debug mode
4. **Documentation**: Refer to this guide and test comments

### Reporting Issues

When reporting test issues, include:

- Test command used
- Error messages
- Test environment details
- Test logs and screenshots
- Steps to reproduce

### Contributing

When adding new tests:

1. Follow existing test patterns
2. Add appropriate test data
3. Update test documentation
4. Ensure tests are maintainable
5. Add performance considerations

## Conclusion

The OptiAI testing suite provides comprehensive coverage of functionality, performance, and security. Regular test execution ensures application reliability and helps identify issues early in the development process.

For questions or issues with testing, please refer to the test documentation or contact the development team.
