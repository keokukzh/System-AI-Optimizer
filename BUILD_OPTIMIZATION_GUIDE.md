# OptiAI Build Optimization Guide

This guide covers the comprehensive build optimization strategy for OptiAI, including frontend optimization, backend bundling, and production deployment.

## Overview

OptiAI uses a multi-layered build optimization approach to ensure:

- **Performance**: Fast loading and execution
- **Security**: Secure production builds
- **Size**: Minimal bundle sizes
- **Compatibility**: Cross-platform support
- **Reliability**: Consistent builds

## Build Optimization Components

### 1. Frontend Optimization (Vite)

**Configuration**: `vite.config.js`

**Key Optimizations**:
- **Code Splitting**: Automatic chunk splitting for better caching
- **Tree Shaking**: Removal of unused code
- **Minification**: JavaScript and CSS minification
- **Asset Optimization**: Image and font optimization
- **Bundle Analysis**: Size analysis and recommendations

**Chunk Strategy**:
```javascript
manualChunks: {
  'react-vendor': ['react', 'react-dom'],
  'ui-vendor': ['framer-motion', 'lucide-react'],
  'chart-vendor': ['recharts'],
  'tauri-vendor': ['@tauri-apps/api'],
  'dashboard': ['./src/components/Dashboard.jsx', ...],
  'scan': ['./src/components/ScanPanel.jsx', ...],
  'system': ['./src/pages/Processes.tsx', ...]
}
```

**Performance Features**:
- ESNext target for modern browsers
- CSS code splitting
- Asset inlining for small files (< 4KB)
- Compression reporting
- Source map generation (development only)

### 2. Backend Optimization (Python)

**Configuration**: `backend/embed_python.py`

**Key Optimizations**:
- **PyInstaller Bundling**: Single executable creation
- **Dependency Optimization**: Minimal dependency inclusion
- **Startup Optimization**: Fast backend startup
- **Resource Management**: Efficient memory usage

**Build Features**:
- One-file executable
- Hidden console window
- Optimized imports
- Resource bundling

### 3. Tauri Optimization (Rust)

**Configuration**: `src-tauri/tauri.conf.json`

**Key Optimizations**:
- **Release Builds**: Optimized Rust compilation
- **Bundle Optimization**: Minimal bundle size
- **Security Hardening**: CSP and permissions
- **Cross-platform**: Windows, macOS, Linux support

**Security Features**:
- Content Security Policy (CSP)
- Restricted permissions
- Secure defaults
- Input validation

## Build Process

### 1. Pre-Build Validation

**Script**: `scripts/pre_build_check.py`

**Validations**:
- Required files and directories
- Configuration validation
- Dependency checks
- Security scans
- License compliance

**Usage**:
```bash
make pre-build
# or
python scripts/pre_build_check.py
```

### 2. Build Optimization

**Script**: `scripts/optimize_build.py`

**Optimizations**:
- Frontend build optimization
- Asset compression
- Image optimization
- Bundle analysis
- Backend bundling
- Tauri compilation

**Usage**:
```bash
make optimize-build
# or
python scripts/optimize_build.py
```

### 3. Complete Production Build

**Command**: `make production-build-optimized`

**Process**:
1. Pre-build validation
2. Build optimization
3. Production build
4. Artifact generation
5. Quality assurance

## Build Commands

### Quick Commands

```bash
# Pre-build validation
make pre-build

# Optimize build
make optimize-build

# Full optimized production build
make production-build-optimized

# Clean build artifacts
make clean
```

### Detailed Commands

```bash
# Frontend build only
npm run build

# Backend build only
cd backend && python embed_python.py

# Tauri build only
cd src-tauri && cargo tauri build --release

# Test build
make test-all
```

## Build Configuration

### Environment Variables

**Development**:
```bash
NODE_ENV=development
VITE_MODE=development
VITE_BACKEND_URL=http://127.0.0.1:5174
```

**Production**:
```bash
NODE_ENV=production
VITE_MODE=production
VITE_BACKEND_URL=http://127.0.0.1:5174
```

### Build Targets

**Frontend**:
- Target: ESNext
- Output: `dist/`
- Assets: `dist/assets/`

**Backend**:
- Target: Windows x64
- Output: `src-tauri/sidecars/backend-server.exe`

**Tauri**:
- Target: All platforms
- Output: `src-tauri/target/release/bundle/`

## Performance Optimization

### Bundle Size Optimization

**Targets**:
- Total bundle size: < 50MB
- JavaScript chunks: < 1MB each
- CSS files: < 100KB each
- Images: Optimized formats

**Techniques**:
- Code splitting
- Lazy loading
- Tree shaking
- Dead code elimination
- Asset compression

### Runtime Performance

**Targets**:
- Startup time: < 5 seconds
- Memory usage: < 200MB
- CPU usage: < 50%
- Response time: < 2 seconds

**Techniques**:
- Lazy component loading
- Memoization
- Virtual scrolling
- Efficient algorithms
- Resource pooling

## Security Optimization

### Content Security Policy

**Configuration**:
```javascript
csp: "default-src 'self'; img-src 'self' asset: https://asset.localhost; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; connect-src 'self' http://127.0.0.1:5174 http://localhost:5174 ws://127.0.0.1:5174 ws://localhost:5174; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
```

**Features**:
- Restricted resource loading
- XSS protection
- Clickjacking prevention
- Secure defaults

### Permission Management

**Configuration**: `src-tauri/capabilities/elevated-permissions.json`

**Features**:
- Minimal required permissions
- Path restrictions
- API limitations
- Security boundaries

## Build Artifacts

### Frontend Artifacts

**Location**: `dist/`

**Contents**:
- `index.html` - Main HTML file
- `assets/js/` - JavaScript bundles
- `assets/css/` - CSS files
- `assets/images/` - Optimized images
- `assets/fonts/` - Font files

### Backend Artifacts

**Location**: `src-tauri/sidecars/`

**Contents**:
- `backend-server.exe` - Python backend executable
- `llama-server.exe` - LLM server executable

### Tauri Artifacts

**Location**: `src-tauri/target/release/bundle/`

**Contents**:
- **Windows**: `.msi`, `.exe` installers
- **macOS**: `.dmg` bundle
- **Linux**: `.AppImage`, `.deb` packages

## Build Analysis

### Bundle Analysis

**Tools**:
- Vite bundle analyzer
- Webpack bundle analyzer
- Custom size analysis

**Metrics**:
- Total bundle size
- Chunk sizes
- Asset sizes
- Compression ratios

### Performance Analysis

**Tools**:
- Lighthouse
- WebPageTest
- Custom performance tests

**Metrics**:
- First Contentful Paint
- Largest Contentful Paint
- Cumulative Layout Shift
- Time to Interactive

## Troubleshooting

### Common Issues

**Build Failures**:
1. Check dependencies
2. Verify configuration
3. Review error logs
4. Clean build artifacts

**Performance Issues**:
1. Analyze bundle size
2. Check for memory leaks
3. Optimize algorithms
4. Review resource usage

**Security Issues**:
1. Validate CSP
2. Check permissions
3. Review input validation
4. Audit dependencies

### Debug Commands

```bash
# Verbose build
npm run build -- --verbose

# Debug Tauri build
cd src-tauri && cargo tauri build --debug

# Analyze bundle
npm run build -- --analyze

# Check dependencies
npm audit
pip audit
```

## Best Practices

### Development

1. **Regular Builds**: Build frequently during development
2. **Incremental Builds**: Use development mode for faster builds
3. **Error Handling**: Implement proper error boundaries
4. **Testing**: Run tests before building

### Production

1. **Validation**: Always run pre-build validation
2. **Optimization**: Use production optimizations
3. **Security**: Implement security best practices
4. **Monitoring**: Monitor build performance

### Maintenance

1. **Updates**: Keep dependencies updated
2. **Cleanup**: Regular build artifact cleanup
3. **Documentation**: Maintain build documentation
4. **Automation**: Automate build processes

## CI/CD Integration

### GitHub Actions

```yaml
name: Build Optimization

on: [push, pull_request]

jobs:
  build:
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
        
    - name: Setup Rust
      uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        
    - name: Pre-build validation
      run: make pre-build
      
    - name: Optimized build
      run: make production-build-optimized
      
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-artifacts
        path: |
          dist/
          src-tauri/target/release/bundle/
```

### Build Pipeline

1. **Validation**: Pre-build checks
2. **Optimization**: Build optimization
3. **Compilation**: Production build
4. **Testing**: Quality assurance
5. **Packaging**: Artifact creation
6. **Deployment**: Release distribution

## Monitoring

### Build Metrics

- Build duration
- Bundle sizes
- Error rates
- Success rates

### Performance Metrics

- Load times
- Memory usage
- CPU usage
- User experience

### Security Metrics

- Vulnerability scans
- Permission audits
- Compliance checks
- Security tests

## Conclusion

The OptiAI build optimization system provides comprehensive optimization for production deployments. Regular use of the optimization tools ensures consistent, performant, and secure builds.

For questions or issues with build optimization, please refer to the build logs or contact the development team.
